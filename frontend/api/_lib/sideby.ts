import type { VercelResponse } from "@vercel/node";
import { z } from "zod";
import { eq, desc, and, asc, or, sql } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import { comparisons, aiRuns, aiRunSteps, queryAnalytics } from "../../src/db/schema.js";
import { runComparisonJob } from "./job-engine.js";
import { getPrimaryProvider } from "./providers/index.js";
import { logger } from "./log.js";
import { normalizeQuery } from "./query-normalizer.js";
import { isFreshEnough, isStaleButUsable, getFreshnessClass, freshnessLabel } from "./reuse-engine.js";
import { comparisonCache, trackCacheHit } from "./cache-layer.js";
import {
  analyzeComparisonQuery,
  summarizeComparisonTaxonomy,
  type ComparisonTaxonomySummary,
} from "../../src/lib/comparisonTaxonomy.js";

export type EntityKey = "a" | "b";

export type ComparisonJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  activeStep: number;
  query: string;
  result: ComparisonResult | null;
  visibility?: "private" | "team" | "public";
  error?: string | null;
  failedStep?: string | null;
  retryable?: boolean;
  activity?: ComparisonActivityStep[];
  reuseSource?: {
    sourceId: string | null;
    type: "memory" | "database" | "stale";
    label: string;
    confidence: number | null;
  };
};

export type ComparisonActivityStep = {
  id: string;
  task: string;
  stepName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  inputSummary: string | null;
  outputSummary: string | null;
  error: string | null;
  model: string | null;
  estimatedCost: number | null;
};

export type ComparisonResult = {
  slug: string;
  query: string;
  context: string;
  taxonomy?: ComparisonTaxonomySummary;
  entities: { a: Entity; b: Entity };
  sourceCount: number;
  updatedAt: string;
  verdict: Verdict;
  categories: CategoryResult[];
  sources: ComparisonSource[];
  dimensions?: Array<{ subject: string; a: number; b: number; fullMark: number }>;
  consensus?: string[];
  contradictions?: string[];
};

export type ComparisonHistoryItem = {
  id: string;
  query: string;
  slug: string;
  status: "running" | "completed" | "failed";
  visibility: "private" | "team" | "public";
  sourceCount: number;
  progress: number;
  updatedAt: string;
  summary: string | null;
  entityA: string | null;
  entityB: string | null;
  queryCategory?: string | null;
  taxonomyStatus?: string | null;
  safetyLevel?: string | null;
  canonicalSlug?: string | null;
  isVague?: boolean;
  reusedFromId?: string | null;
};

type ResearchScheduler = (promise: Promise<void>) => void;

type Entity = {
  name: string;
  subtitle: string;
  mark: string;
  color: string;
  hex: string;
  logoUrl?: string;
};

type Verdict = {
  bestOverall: string;
  bestValue: string;
  developers: string;
  teams: string;
  students: string;
  powerUsers: string;
  ecosystem: string;
  summary: string;
};

type CategoryResult = {
  name: string;
  winner: "a" | "b" | "tie";
  verdict: string;
  facts: Fact[];
};

type Fact = {
  entity: EntityKey;
  label: string;
  value: string;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  freshness: "Fresh" | "Monitor" | "Stable";
  changed: boolean;
  previousValue?: string;
};

type ComparisonSource = {
  title: string;
  url: string;
  reliability: "Official" | "Docs" | "Community";
  sourceType: string;
  extractionMethod: string;
  fetchedAt: string;
  confidence: number;
  contentHash: string;
  summary: string;
};

// ─── Exports ───────────────────────────────────────────────────────────────

export const sendJson = (response: VercelResponse, payload: unknown, status = 200) => {
  if (!response.hasHeader("Cache-Control")) {
    response.setHeader("Cache-Control", "no-store");
  }
  return response.status(status).json(payload);
};

const isPrivateOwnershipRequired = () =>
  Boolean(process.env.CLERK_SECRET_KEY) ||
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production";

const canAccessComparison = (
  visibility: "private" | "team" | "public",
  ownerId: string | null,
  clerkUserId: string | null,
) => {
  if (visibility === "public") return true;
  if (
    !isPrivateOwnershipRequired() &&
    process.env.DEV_ALLOW_PUBLIC_COMPARISON_ACCESS === "true" &&
    !ownerId
  ) {
    return true;
  }
  return Boolean(ownerId && clerkUserId && ownerId === clerkUserId);
};

export interface CreateComparisonInput {
  query: string;
  userId: string;
  orgId?: string;
  workspaceId?: string;
  projectId?: string;
}

type ReusableComparisonRow = {
  id: string;
  result: unknown;
  visibility: "private" | "team" | "public";
  clerkUserId: string | null;
  clerkOrgId: string | null;
  updatedAt: Date;
  sourceCount: number;
  overallConfidence: string | null;
  freshnessClass: string | null;
};

const materializeCachedResult = (
  result: ComparisonResult,
  slugValue: string,
  query: string,
): ComparisonResult => ({
  ...result,
  slug: slugValue,
  query,
  taxonomy: result.taxonomy || summarizeComparisonTaxonomy(analyzeComparisonQuery(query)),
  updatedAt: new Date().toISOString(),
});

const createCachedComparisonRecord = async (
  db: ReturnType<typeof createDbClient>,
  params: {
    id: string;
    input: CreateComparisonInput;
    parsed: ParsedComparison;
    normalized: ReturnType<typeof normalizeQuery>;
    comparisonSlug: string;
    result: ComparisonResult;
    sourceCount: number;
    freshnessClass: string;
    reuseSourceId: string | null;
    cacheHits: number;
  },
) => {
  await db.insert(comparisons).values({
    id: params.id,
    query: params.parsed.normalizedQuery,
    slug: params.comparisonSlug,
    taxonomyCategory: params.normalized.category,
    taxonomyStatus: params.normalized.taxonomyStatus,
    taxonomyConfidence: String(params.normalized.confidence),
    safetyLevel: params.normalized.safetyLevel,
    policyNote: params.normalized.policyNote || null,
    status: "completed",
    visibility: "private",
    clerkUserId: params.input.userId,
    clerkOrgId: params.input.orgId || null,
    workspaceId: params.input.workspaceId || null,
    projectId: params.input.projectId || null,
    progress: 100,
    activeStep: 5,
    sourceCount: params.sourceCount,
    result: params.result,
    freshnessClass: params.freshnessClass,
    reuseSourceId: params.reuseSourceId,
    totalCost: "0",
  });

  await db.insert(queryAnalytics).values({
    comparisonId: params.id,
    rawQuery: params.input.query,
    normalizedQuery: params.normalized.normalizedQuery,
    canonicalSlug: params.normalized.canonicalSlug,
    detectedEntities: JSON.stringify([
      { name: params.parsed.entityA, type: null },
      { name: params.parsed.entityB, type: null },
    ]),
    queryCategory: params.normalized.category,
    taxonomyStatus: params.normalized.taxonomyStatus,
    safetyLevel: params.normalized.safetyLevel,
    taxonomyConfidence: String(params.normalized.confidence),
    policyNote: params.normalized.policyNote || null,
    policySignals: null,
    sourceStrategy: {
      requirements: params.normalized.sourceRequirements,
      disclaimer: params.normalized.disclaimer,
    },
    isVague: params.normalized.isVague,
    reusedFromId: params.reuseSourceId,
    totalCost: "0",
    searchesUsed: 0,
    sourcesFound: params.sourceCount,
    cacheHits: params.cacheHits,
  });
};

const findReusableComparison = async (
  db: ReturnType<typeof createDbClient>,
  input: CreateComparisonInput,
  normalized: ReturnType<typeof normalizeQuery>,
): Promise<ReusableComparisonRow | undefined> => {
  const rows = await db
    .select({
      id: comparisons.id,
      result: comparisons.result,
      visibility: comparisons.visibility,
      clerkUserId: comparisons.clerkUserId,
      clerkOrgId: comparisons.clerkOrgId,
      updatedAt: comparisons.updatedAt,
      sourceCount: comparisons.sourceCount,
      overallConfidence: comparisons.overallConfidence,
      freshnessClass: comparisons.freshnessClass,
    })
    .from(comparisons)
    .innerJoin(queryAnalytics, eq(comparisons.id, queryAnalytics.comparisonId))
    .where(
      and(
        eq(comparisons.status, "completed"),
        eq(queryAnalytics.canonicalSlug, normalized.canonicalSlug),
        sql`${comparisons.result} IS NOT NULL`,
        or(
          eq(comparisons.clerkUserId, input.userId),
          input.orgId
            ? and(eq(comparisons.clerkOrgId, input.orgId), eq(comparisons.visibility, "team"))
            : sql`false`,
          eq(comparisons.visibility, "public"),
        ),
      ),
    )
    .orderBy(desc(comparisons.updatedAt))
    .limit(25);

  return rows
    .map((row) => ({
      ...row,
      score:
        row.clerkUserId === input.userId
          ? 3
          : input.orgId && row.clerkOrgId === input.orgId && row.visibility === "team"
            ? 2
            : row.visibility === "public"
              ? 1
              : 0,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.updatedAt.getTime() - a.updatedAt.getTime())[0];
};

export const createComparisonJob = async (
  input: CreateComparisonInput,
  scheduleResearch?: ResearchScheduler,
): Promise<ComparisonJob> => {
  const intent = analyzeComparisonQuery(input.query);
  if (!intent.canStart) {
    throw Object.assign(new Error(intent.message), {
      statusCode: 422,
      code: intent.status === "sensitive" ? "QUERY_SENSITIVE" : "QUERY_NOT_COMPARABLE",
    });
  }

  const parsed = await parseQueryWithLlm(input.query);
  const normalized = normalizeQuery(input.query, { entityA: parsed.entityA, entityB: parsed.entityB });
  const id = crypto.randomUUID();
  const comparisonSlug = uniqueSlug(slug(parsed.entityA, parsed.entityB));

  const db = createDbClient();
  const freshnessClass = getFreshnessClass(normalized.category);

  // ─── Phase 12: In-memory cache check (fastest) ───────────────────────
  const memoryHit = comparisonCache.get<ComparisonResult>(normalized.canonicalSlug);
  if (memoryHit) {
    logger.info("Memory cache hit", { canonicalSlug: normalized.canonicalSlug });
    const result = materializeCachedResult(memoryHit, comparisonSlug, parsed.normalizedQuery);
    await createCachedComparisonRecord(db, {
      id,
      input,
      parsed,
      normalized,
      comparisonSlug,
      result,
      sourceCount: result.sourceCount || 0,
      freshnessClass,
      reuseSourceId: null,
      cacheHits: 0,
    });
    await trackCacheHit(db, id, "memory", 0);

    return {
      id,
      status: "completed",
      progress: 100,
      activeStep: 5,
      query: parsed.normalizedQuery,
      result,
      visibility: "private",
      error: null,
      reuseSource: {
        sourceId: null,
        type: "memory",
        label: "Instant hot-cache result",
        confidence: null,
      },
    };
  }

  // ─── Phase 11: True Result Reuse ──────────────────────────────────────
  const reusedSource = await findReusableComparison(db, input, normalized);
  const isCached = reusedSource && isFreshEnough(reusedSource.updatedAt, normalized.category);
  const canServeStale =
    reusedSource && !isCached && isStaleButUsable(reusedSource.updatedAt, normalized.category);

  // Create the comparison record
  await db.insert(comparisons).values({
    id,
    query: parsed.normalizedQuery,
    slug: comparisonSlug,
    taxonomyCategory: normalized.category,
    taxonomyStatus: normalized.taxonomyStatus,
    taxonomyConfidence: String(normalized.confidence),
    safetyLevel: normalized.safetyLevel,
    policyNote: normalized.policyNote || null,
    status: isCached || canServeStale ? "completed" : "queued",
    visibility: "private",
    clerkUserId: input.userId,
    clerkOrgId: input.orgId || null,
    workspaceId: input.workspaceId || null,
    projectId: input.projectId || null,
    progress: isCached || canServeStale ? 100 : 0,
    activeStep: isCached || canServeStale ? 5 : 0,
    sourceCount: isCached || canServeStale ? (reusedSource?.sourceCount || 0) : 0,
    result: isCached || canServeStale
      ? materializeCachedResult(reusedSource?.result as ComparisonResult, comparisonSlug, parsed.normalizedQuery)
      : null,
    freshnessClass,
    reuseSourceId: isCached || canServeStale ? reusedSource?.id : null,
    overallConfidence: isCached || canServeStale
      ? reusedSource?.overallConfidence || null
      : null,
    totalCost: isCached || canServeStale ? "0" : null,
  });

  // Phase 10: Save query analytics
  await db.insert(queryAnalytics).values({
    comparisonId: id,
    rawQuery: input.query,
    normalizedQuery: normalized.normalizedQuery,
    canonicalSlug: normalized.canonicalSlug,
    detectedEntities: JSON.stringify([
      { name: parsed.entityA, type: null },
      { name: parsed.entityB, type: null },
    ]),
    queryCategory: normalized.category,
    taxonomyStatus: normalized.taxonomyStatus,
    safetyLevel: normalized.safetyLevel,
    taxonomyConfidence: String(normalized.confidence),
    policyNote: normalized.policyNote || null,
    policySignals: null,
    sourceStrategy: {
      requirements: normalized.sourceRequirements,
      disclaimer: normalized.disclaimer,
    },
    isVague: normalized.isVague,
    reusedFromId: isCached || canServeStale ? reusedSource?.id : null,
    totalCost: isCached || canServeStale ? "0" : null,
    searchesUsed: isCached || canServeStale ? 0 : undefined,
    sourcesFound: isCached || canServeStale ? reusedSource?.sourceCount || 0 : undefined,
    cacheHits: 0,
  });

  // If we have a cached fresh result, return it immediately
  if (isCached && reusedSource?.result) {
    const cachedResult = materializeCachedResult(reusedSource.result as ComparisonResult, comparisonSlug, parsed.normalizedQuery);

    // Phase 12: Populate in-memory cache for next lookup
    comparisonCache.set(normalized.canonicalSlug, cachedResult, 10 * 60 * 1000);

    // Track cache hit for analytics
    trackCacheHit(db, id, "db", 0).catch(() => {});

    logger.info("Returning cached comparison", {
      comparisonId: id,
      sourceId: reusedSource.id,
      category: normalized.category,
      freshnessClass,
    });

    return {
      id,
      status: "completed",
      progress: 100,
      activeStep: 5,
      query: parsed.normalizedQuery,
      result: cachedResult,
      visibility: "private",
      error: null,
      reuseSource: {
        sourceId: reusedSource.id,
        type: "database",
        label: freshnessLabel(reusedSource.updatedAt!, normalized.category),
        confidence: reusedSource.overallConfidence ? Number(reusedSource.overallConfidence) : null,
      },
    };
  }

  // Phase 12: Background refresh for stale (but existing) comparisons
  if (canServeStale && reusedSource?.result) {
    const staleResult = materializeCachedResult(reusedSource.result as ComparisonResult, comparisonSlug, parsed.normalizedQuery);
    trackCacheHit(db, id, "reuse", 0).catch(() => {});

    // Serve the stale result immediately while refreshing the source record for future users.
    if (process.env.DISABLE_IN_PROCESS_JOBS === "true") {
      db.update(comparisons)
        .set({ status: "queued", progress: 0, activeStep: 0, updatedAt: new Date() })
        .where(eq(comparisons.id, reusedSource.id))
        .catch(() => {});
      logger.info(`[DISABLE_IN_PROCESS_JOBS] Background refresh for source ${reusedSource.id} queued for external worker.`);
    } else {
      const bgRefresh = runComparisonJob(reusedSource.id, input.userId, input.query, input.orgId).catch((e) => {
        logger.warn(`Background refresh failed for ${reusedSource!.id}`, { error: e instanceof Error ? e.message : String(e) });
      });
      if (scheduleResearch) scheduleResearch(bgRefresh);
      else bgRefresh.catch(() => {});
    }

    logger.info("Serving stale comparison + enqueued background refresh", {
      comparisonId: id,
      sourceId: reusedSource.id,
      freshnessClass,
    });

    return {
      id,
      status: "completed",
      progress: 100,
      activeStep: 5,
      query: parsed.normalizedQuery,
      result: staleResult,
      visibility: "private",
      error: null,
      reuseSource: {
        sourceId: reusedSource.id,
        type: "stale",
        label: `Stale; refreshing in background (${freshnessLabel(reusedSource.updatedAt!, normalized.category)})`,
        confidence: reusedSource.overallConfidence ? Number(reusedSource.overallConfidence) : null,
      },
    };
  }

  // Otherwise, run the full research pipeline
  if (process.env.DISABLE_IN_PROCESS_JOBS === "true") {
    logger.info(`[DISABLE_IN_PROCESS_JOBS] Comparison job ${id} queued for external worker.`);
  } else {
    const research = runComparisonJob(id, input.userId, input.query, input.orgId).catch((e) => {
      logger.error(`Research job ${id} failed`, e instanceof Error ? e : undefined, { comparisonId: id });
    });

    if (scheduleResearch) {
      scheduleResearch(research);
    } else {
      research.catch(() => {});
    }
  }

  return {
    id,
    status: "running",
    progress: 0,
    activeStep: 0,
    query: parsed.normalizedQuery,
    result: null,
    visibility: "private",
    error: null,
  };
};

const summarizeSnapshot = (snapshot: unknown): string | null => {
  if (snapshot === null || snapshot === undefined) return null;
  if (typeof snapshot === "string") return snapshot.slice(0, 180);
  if (typeof snapshot === "number" || typeof snapshot === "boolean") {
    return String(snapshot);
  }
  if (Array.isArray(snapshot)) {
    return `${snapshot.length} item${snapshot.length === 1 ? "" : "s"}`;
  }
  if (typeof snapshot !== "object") return null;

  const record = snapshot as Record<string, unknown>;
  const parts: string[] = [];
  const pushNumber = (key: string, label: string) => {
    const value = record[key];
    if (typeof value === "number") parts.push(`${label}: ${value}`);
  };
  const pushString = (key: string, label: string) => {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      parts.push(`${label}: ${value.trim().slice(0, 80)}`);
    }
  };

  pushNumber("sourceCount", "sources");
  pushNumber("extractedCount", "extracted");
  pushNumber("factCount", "facts");
  pushNumber("scoreCount", "scores");
  pushNumber("entityCount", "entities");
  pushString("provider", "provider");
  pushString("model", "model");
  pushString("winner", "winner");

  if (Array.isArray(record.entities)) {
    const names = record.entities
      .map((entity) =>
        typeof entity === "object" && entity && "name" in entity
          ? String((entity as { name?: unknown }).name || "")
          : "",
      )
      .filter(Boolean);
    if (names.length > 0) parts.push(`entities: ${names.join(" vs ")}`);
  }

  if (parts.length > 0) return parts.join(" | ");

  try {
    return JSON.stringify(snapshot).slice(0, 180);
  } catch {
    return null;
  }
};

const isoOrNull = (value: Date | null | undefined) =>
  value ? value.toISOString() : null;

const getComparisonActivity = async (
  db: ReturnType<typeof createDbClient>,
  comparisonId: string,
): Promise<ComparisonActivityStep[]> => {
  const rows = await db
    .select({
      id: aiRunSteps.id,
      stepName: aiRunSteps.stepName,
      status: aiRunSteps.status,
      inputSnapshot: aiRunSteps.inputSnapshot,
      outputSnapshot: aiRunSteps.outputSnapshot,
      errorTrace: aiRunSteps.errorTrace,
      startedAt: aiRunSteps.startedAt,
      completedAt: aiRunSteps.completedAt,
      createdAt: aiRunSteps.createdAt,
      task: aiRuns.task,
      model: aiRuns.model,
      estimatedCost: aiRuns.estimatedCost,
      latencyMs: aiRuns.latencyMs,
    })
    .from(aiRunSteps)
    .innerJoin(aiRuns, eq(aiRunSteps.aiRunId, aiRuns.id))
    .where(eq(aiRuns.comparisonId, comparisonId))
    .orderBy(asc(aiRunSteps.createdAt))
    .limit(60);

  return rows.map((row) => {
    const startedAt = row.startedAt ?? row.createdAt ?? null;
    const completedAt = row.completedAt ?? null;
    const durationMs = startedAt && completedAt
      ? Math.max(0, completedAt.getTime() - startedAt.getTime())
      : row.latencyMs ?? null;

    return {
      id: row.id,
      task: row.task,
      stepName: row.stepName,
      status: row.status,
      startedAt: isoOrNull(startedAt),
      completedAt: isoOrNull(completedAt),
      durationMs,
      inputSummary: summarizeSnapshot(row.inputSnapshot),
      outputSummary: summarizeSnapshot(row.outputSnapshot),
      error: row.errorTrace,
      model: row.model === "unknown" ? null : row.model,
      estimatedCost: row.estimatedCost === null ? null : Number(row.estimatedCost),
    };
  });
};

export const getComparisonJob = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const db = createDbClient();
  const rows = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.id, id))
    .limit(1);

  if (!rows[0]) throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });

  const d = rows[0];
  if (!canAccessComparison(d.visibility, d.clerkUserId, clerkUserId)) {
    throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });
  }

  const isRunning = d.status === "running" || d.status === "queued";

  // Fetch latest failed step for failed jobs
  let failedStep: string | null = null;
  if (d.status === "failed") {
    const failedSteps = await db
      .select({ stepName: aiRunSteps.stepName, errorTrace: aiRunSteps.errorTrace })
      .from(aiRunSteps)
      .innerJoin(aiRuns, eq(aiRunSteps.aiRunId, aiRuns.id))
      .where(
        and(
          eq(aiRuns.comparisonId, id),
          eq(aiRunSteps.status, "failed"),
        ),
      )
      .orderBy(desc(aiRunSteps.createdAt))
      .limit(1);

    if (failedSteps.length > 0) {
      failedStep = failedSteps[0].stepName;
      // If no error message on comparison, use step error
      if (!d.errorMessage && failedSteps[0].errorTrace) {
        d.errorMessage = failedSteps[0].errorTrace;
      }
    }
  }

  const status = isRunning || d.status === "queued" || d.status === "running"
    ? "running"
    : d.status as "completed" | "failed";
  const activity = await getComparisonActivity(db, id);

  const result = d.result
    ? ({
        ...(d.result as ComparisonResult),
        slug: d.slug,
        taxonomy: (d.result as ComparisonResult).taxonomy ||
          summarizeComparisonTaxonomy(analyzeComparisonQuery(d.query)),
      } satisfies ComparisonResult)
    : null;

  return {
    id: d.id,
    status,
    progress: d.progress,
    activeStep: d.activeStep,
    query: d.query,
    result,
    visibility: d.visibility,
    error: d.errorMessage,
    failedStep,
    retryable: d.status === "failed",
    activity,
  };
};

export const publishComparison = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const job = await getComparisonJob(id, clerkUserId);
  const db = createDbClient();

  await db
    .update(comparisons)
    .set({ visibility: "public", updatedAt: new Date() })
    .where(eq(comparisons.id, id));

  return { ...job, visibility: "public" };
};

export const unpublishComparison = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const job = await getComparisonJob(id, clerkUserId);
  const db = createDbClient();

  await db
    .update(comparisons)
    .set({ visibility: "private", updatedAt: new Date() })
    .where(eq(comparisons.id, id));

  return { ...job, visibility: "private" };
};

export const listComparisonHistory = async (
  clerkUserId: string | null = null,
  limit = 12,
): Promise<ComparisonHistoryItem[]> => {
  if (!clerkUserId) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const db = createDbClient();

  const rows = await db
    .select({
      id: comparisons.id,
      query: comparisons.query,
      slug: comparisons.slug,
      status: comparisons.status,
      visibility: comparisons.visibility,
      sourceCount: comparisons.sourceCount,
      progress: comparisons.progress,
      updatedAt: comparisons.updatedAt,
      result: comparisons.result,
      queryCategory: queryAnalytics.queryCategory,
      taxonomyStatus: queryAnalytics.taxonomyStatus,
      safetyLevel: queryAnalytics.safetyLevel,
      canonicalSlug: queryAnalytics.canonicalSlug,
      isVague: queryAnalytics.isVague,
      reusedFromId: queryAnalytics.reusedFromId,
    })
    .from(comparisons)
    .leftJoin(queryAnalytics, eq(comparisons.id, queryAnalytics.comparisonId))
    .where(eq(comparisons.clerkUserId, clerkUserId))
    .orderBy(desc(comparisons.updatedAt))
    .limit(safeLimit);

  return rows.map((row) => {
    const result = row.result as ComparisonResult | null;
    return {
      id: row.id,
      query: row.query,
      slug: row.slug,
      status: row.status === "queued" || row.status === "running" ? "running" : row.status,
      visibility: row.visibility,
      sourceCount: row.sourceCount,
      progress: row.progress,
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
      summary: result?.verdict?.summary || null,
      entityA: result?.entities?.a?.name || null,
      entityB: result?.entities?.b?.name || null,
      queryCategory: row.queryCategory,
      taxonomyStatus: row.taxonomyStatus,
      safetyLevel: row.safetyLevel,
      canonicalSlug: row.canonicalSlug,
      isVague: row.isVague ?? false,
      reusedFromId: row.reusedFromId,
    };
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────

type ParsedComparison = {
  entityA: string;
  entityB: string;
  context: string;
  normalizedQuery: string;
};

const ParseQuerySchema = z.object({
  entities: z.array(z.string()).min(2).max(5),
  context: z.string().optional(),
});

export const parseQueryWithLlm = async (raw: string): Promise<ParsedComparison> => {
  const q = raw?.trim() || "Supabase vs Firebase for a SaaS";
  
  // Try heuristic first (very fast, zero cost)
  const parts = q.split(/\s+vs\.?\s+/i);
  if (parts.length >= 2) {
    const left = parts[0] || "";
    const [right, ctx] = parts.slice(1).join(" vs ").split(/\s+for\s+/i);
    const ea = normalizeEntity(left);
    const eb = normalizeEntity(right);
    if (ea && eb) {
      const context = ctx?.trim() ? `for ${ctx.trim()}` : q.toLowerCase().includes("saas") ? "for a SaaS product" : "for the decision you described";
      return { entityA: ea, entityB: eb, context, normalizedQuery: `${ea} vs ${eb} ${context}` };
    }
  }

  // LLM fallback for natural queries (e.g. "React or Vue for SaaS?")
  try {
    const provider = getPrimaryProvider();
    const prompt = [
      {
        role: "system" as const,
        content: "You are a query parser for SideBy. Extract the two primary entities being compared and the context of the comparison. Return ONLY valid JSON with 'entities' (array of strings, exactly 2 entities) and 'context' (string, e.g. 'for SaaS development').",
      },
      {
        role: "user" as const,
        content: `Extract entities from this comparison query: "${q}"`,
      },
    ];
    const result = await provider.generateObject(prompt, ParseQuerySchema);
    const entities = result.data.entities;
    const ea = normalizeEntity(entities[0] || "Supabase");
    const eb = normalizeEntity(entities[1] || "Firebase");
    const context = result.data.context ? `for ${result.data.context.trim()}` : "for your use case";
    return {
      entityA: ea,
      entityB: eb,
      context,
      normalizedQuery: `${ea} vs ${eb} ${context}`
    };
  } catch (error) {
    logger.warn("LLM query parse fallback failed, using fallback default", { error });
    // Default fallback
    const ea = "Option A";
    const eb = "Option B";
    const context = "for the decision you described";
    return { entityA: ea, entityB: eb, context, normalizedQuery: `${ea} vs ${eb} ${context}` };
  }
};

const normalizeEntity = (v: string) => v.replace(/\b(for|with|inside|on)\b.*$/i, "").replace(/[^a-z0-9\s+.-]/gi, "").trim();
const slug = (a: string, b: string) => `${a}-vs-${b}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const uniqueSlug = (base: string) => `${base}-${Date.now().toString(36)}`;
