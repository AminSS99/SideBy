/**
 * Comparison Refresh Engine with Change Detection
 * Re-runs the comparison pipeline and detects what changed.
 */
import { eq } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import {
  comparisons,
  comparisonEntities,
  comparisonDimensions,
  comparisonSources,
  comparisonFacts,
  comparisonScores,
  comparisonVerdicts,
} from "../../src/db/schema.js";
import { canMutateComparison } from "./db-auth.js";
import { runComparisonJob } from "./job-engine.js";
import { logger } from "./log.js";

export interface RefreshResult {
  comparisonId: string;
  status: string;
  changes: {
    newFacts: number;
    updatedFacts: number;
    removedFacts: number;
    newSources: number;
    scoreChanges: Array<{
      dimension: string;
      entity: string;
      oldScore: number;
      newScore: number;
    }>;
  };
}

export async function refreshComparison(
  comparisonId: string,
  userId: string,
): Promise<RefreshResult> {
  const db = createDbClient();

  const canMutate = await canMutateComparison(db, userId, comparisonId);
  if (!canMutate) {
    throw new Error("Not authorized to refresh this comparison.");
  }

  const [comp] = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.id, comparisonId))
    .limit(1);

  if (!comp) {
    throw new Error("Comparison not found.");
  }

  // Snapshot old state
  const oldFacts = await db
    .select()
    .from(comparisonFacts)
    .where(eq(comparisonFacts.comparisonId, comparisonId));

  const oldScores = await db
    .select()
    .from(comparisonScores)
    .where(eq(comparisonScores.comparisonId, comparisonId));

  const oldSources = await db
    .select()
    .from(comparisonSources)
    .where(eq(comparisonSources.comparisonId, comparisonId));

  type FactRow = typeof oldFacts[number];
  const factKey = (fact: FactRow) => {
    const metadata = (fact.metadata || {}) as { factHash?: string };
    return metadata.factHash || fact.id;
  };

  const oldFactMap = new Map(oldFacts.map((f) => [factKey(f), f]));
  const oldScoreMap = new Map(
    oldScores.map((s) => [`${s.entityId}:${s.dimensionId}`, s]),
  );

  // Delete old derived data (keep comparison record)
  await db.delete(comparisonFacts).where(eq(comparisonFacts.comparisonId, comparisonId));
  await db.delete(comparisonScores).where(eq(comparisonScores.comparisonId, comparisonId));
  await db.delete(comparisonVerdicts).where(eq(comparisonVerdicts.comparisonId, comparisonId));
  await db.delete(comparisonSources).where(eq(comparisonSources.comparisonId, comparisonId));

  // Reset comparison to queued
  await db
    .update(comparisons)
    .set({
      status: "queued",
      progress: 0,
      result: null,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(comparisons.id, comparisonId));

  // Re-run the job
  await runComparisonJob(comparisonId, userId, comp.query, comp.clerkOrgId || undefined);

  // Fetch new state
  const newFacts = await db
    .select()
    .from(comparisonFacts)
    .where(eq(comparisonFacts.comparisonId, comparisonId));

  const newScores = await db
    .select()
    .from(comparisonScores)
    .where(eq(comparisonScores.comparisonId, comparisonId));

  const newSources = await db
    .select()
    .from(comparisonSources)
    .where(eq(comparisonSources.comparisonId, comparisonId));

  // Detect changes
  const newFactHashes = new Set(newFacts.map((f) => factKey(f)));
  const oldFactHashes = new Set(oldFacts.map((f) => factKey(f)));

  const addedFacts = newFacts.filter((f) => !oldFactHashes.has(factKey(f)));
  const removedFacts = oldFacts.filter((f) => !newFactHashes.has(factKey(f)));
  const updatedFacts = newFacts.filter((f) => {
    const old = oldFactMap.get(factKey(f));
    return old && old.confidence !== f.confidence;
  });

  const scoreChanges: Array<{
    dimension: string;
    entity: string;
    oldScore: number;
    newScore: number;
  }> = [];

  for (const newScore of newScores) {
    const key = `${newScore.entityId}:${newScore.dimensionId}`;
    const old = oldScoreMap.get(key);
    if (old && old.score !== newScore.score) {
      scoreChanges.push({
        dimension: newScore.dimensionId || "unknown",
        entity: newScore.entityId || "unknown",
        oldScore: Number(old.score) || 0,
        newScore: Number(newScore.score) || 0,
      });
    }
  }

  logger.info("Comparison refreshed", {
    comparisonId,
    newFacts: addedFacts.length,
    updatedFacts: updatedFacts.length,
    removedFacts: removedFacts.length,
    newSources: newSources.length - oldSources.length,
    scoreChanges: scoreChanges.length,
  });

  return {
    comparisonId,
    status: "refreshed",
    changes: {
      newFacts: addedFacts.length,
      updatedFacts: updatedFacts.length,
      removedFacts: removedFacts.length,
      newSources: Math.max(0, newSources.length - oldSources.length),
      scoreChanges,
    },
  };
}
