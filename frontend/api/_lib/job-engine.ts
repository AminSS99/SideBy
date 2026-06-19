/**
 * SideBy Comparison Job Engine
 * Manages job lifecycle: queued → searching → extracting → reasoning → completed/failed
 * Persists every step in ai_runs / ai_run_steps.
 * Enforces cost/time guardrails per job.
 */
import { z } from "zod";
import { asc, eq, and, sql, or, lte } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import {
  comparisons,
  comparisonEntities,
  comparisonDimensions,
  comparisonSources,
  comparisonFacts,
  comparisonScores,
  comparisonVerdicts,
  aiRuns,
  aiRunSteps,
  usageEvents,
  queryAnalytics,
  entityKnowledge,
  comparisonVersions,
  watchlists,
} from "../../src/db/schema.js";
import { computeResultDiff } from "./diff-engine.js";
import { getPrimaryProvider } from "./providers/index.js";
import { searchEntitySources } from "./search.js";
import { extractPage } from "./firecrawl.js";
import { redisAcquireLockToken, redisForceReleaseLock, redisReleaseLock } from "./redis.js";
import { logger } from "./log.js";
import { embedText, embedTexts } from "./embeddings.js";
import type { AIProvider } from "./ai-adapter.js";
import crypto from "crypto";
import { sanitizeLlmText } from "./sanitize.js";
import { sendComparisonCompleteEmail } from "./email.js";
import { buildDimensionPrompt, calibrateConfidence, getFreshnessClass, isReusableFact, normalizeEntityForReuse } from "./reuse-engine.js";
import { normalizeQuery } from "./query-normalizer.js";
import { comparisonCache, hashPrompt } from "./cache-layer.js";
import {
  analyzeComparisonQuery,
  getComparisonCategoryDefinition,
  summarizeComparisonTaxonomy,
  type ComparisonIntent,
} from "../../src/lib/comparisonTaxonomy.js";
import { triggerWebhooks } from "./webhook-notifier.js";
import { queueSnapSolveEvent } from "./snapsolve-core.js";
import { waitUntil as vercelWaitUntil } from "@vercel/functions";

const safeWaitUntil = (promise: Promise<unknown>) => {
  if (process.env.VERCEL === "1") {
    try {
      vercelWaitUntil(promise);
      return;
    } catch (e) {
      // Fallback
    }
  }
  promise.catch(() => {});
};

// ─── Guardrails ─────────────────────────────────────────────────────────────

const MAX_JOB_COST_USD = Number(process.env.MAX_JOB_COST_USD || "0.50");
const MAX_JOB_TIME_MS = Number(process.env.MAX_JOB_TIME_MS || "300000"); // 5 minutes
const MAX_SEARCH_CALLS = Number(process.env.MAX_SEARCH_CALLS || "12");
const MAX_AI_CALLS = Number(process.env.MAX_AI_CALLS || "6");

interface GuardrailState {
  totalCost: number;
  totalTimeMs: number;
  searchCalls: number;
  aiCalls: number;
  startTime: number;
}

function createGuardrails(): GuardrailState {
  return {
    totalCost: 0,
    totalTimeMs: 0,
    searchCalls: 0,
    aiCalls: 0,
    startTime: Date.now(),
  };
}

function checkGuardrails(state: GuardrailState): void {
  const elapsed = Date.now() - state.startTime;

  if (state.totalCost > MAX_JOB_COST_USD) {
    throw new Error(
      `Job cost guardrail exceeded: $${state.totalCost.toFixed(4)} > $${MAX_JOB_COST_USD}`,
    );
  }
  if (elapsed > MAX_JOB_TIME_MS) {
    throw new Error(
      `Job time guardrail exceeded: ${elapsed}ms > ${MAX_JOB_TIME_MS}ms`,
    );
  }
  if (state.searchCalls > MAX_SEARCH_CALLS) {
    throw new Error(
      `Search call guardrail exceeded: ${state.searchCalls} > ${MAX_SEARCH_CALLS}`,
    );
  }
  if (state.aiCalls > MAX_AI_CALLS) {
    throw new Error(
      `AI call guardrail exceeded: ${state.aiCalls} > ${MAX_AI_CALLS}`,
    );
  }
}

// ─── Source Reliability Heuristic ───────────────────────────────────────────

function computeSourceReliability(url: string, title: string): number {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Official domains get highest score
  const officialDomains = [
    ".gov", ".edu", "github.com", "gitlab.com",
    "docs.", "documentation.", "developer.", "api.",
  ];
  for (const domain of officialDomains) {
    if (lowerUrl.includes(domain)) return 1.0;
  }

  // Known docs/pricing pages
  if (/\/(docs?|documentation|pricing|features|api)\b/.test(lowerUrl)) return 0.9;
  if (lowerTitle.includes("documentation") || lowerTitle.includes("official")) return 0.9;

  // Statistics/data sources
  if (lowerUrl.includes("statista") || lowerUrl.includes("census") || lowerUrl.includes("bureau")) {
    return 0.9;
  }

  // News sources
  const newsDomains = [
    "techcrunch.com", "theverge.com", "wired.com", "arstechnica.com",
    "reuters.com", "bloomberg.com", "forbes.com",
  ];
  for (const domain of newsDomains) {
    if (lowerUrl.includes(domain)) return 0.7;
  }

  // Review/community
  const reviewDomains = [
    "reddit.com", "stackoverflow.com", "quora.com",
    "trustpilot.com", "g2.com", "capterra.com",
  ];
  for (const domain of reviewDomains) {
    if (lowerUrl.includes(domain)) return 0.6;
  }

  // Blogs/medium
  if (lowerUrl.includes("medium.com") || lowerUrl.includes("blog") || lowerUrl.includes("dev.to")) {
    return 0.55;
  }

  // Default
  return 0.7;
}

// ─── Job Context ────────────────────────────────────────────────────────────

interface JobContext {
  comparisonId: string;
  userId: string;
  orgId?: string;
  query: string;
  guardrails: GuardrailState;
  provider: AIProvider;
  db: ReturnType<typeof createDbClient>;
  taxonomy: ComparisonIntent;
}

// ─── Zod Schemas for AI Outputs ─────────────────────────────────────────────

const LlmStringSchema = (maxLength: number) =>
  z.string().max(maxLength).transform((value) => sanitizeLlmText(value, maxLength));

const EntitySchema = z.object({
  name: LlmStringSchema(160),
  type: LlmStringSchema(80).optional(),
});

const EntityInputSchema = z.union([EntitySchema, LlmStringSchema(160).pipe(z.string().min(1))]);

interface ParsedEntity {
  name: string;
  type?: string;
}

interface ParsedQuery {
  entities: ParsedEntity[];
  context?: string;
  comparisonType?: string;
}

const DimensionSchema = z.object({
  name: LlmStringSchema(160),
  description: LlmStringSchema(1000).optional(),
  weight: z.number().default(1),
});

const FactSchema = z.object({
  entity: LlmStringSchema(160),
  dimension: LlmStringSchema(160),
  value: LlmStringSchema(2500),
  confidence: z.number().min(0).max(1),
  citation: LlmStringSchema(2000).optional(),
});

const ScoreSchema = z.object({
  entity: LlmStringSchema(160),
  dimension: LlmStringSchema(160),
  score: z.number().min(0).max(100),
  rationale: LlmStringSchema(2500),
});

const VerdictSchema = z.object({
  overall: LlmStringSchema(4000).optional(),
  summary: LlmStringSchema(4000).optional(),
  verdict: LlmStringSchema(4000).optional(),
  recommendation: LlmStringSchema(4000).optional(),
  winner: LlmStringSchema(160).optional(),
  tradeoffs: LlmStringSchema(4000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  caveats: LlmStringSchema(4000).optional(),
  personas: z.record(LlmStringSchema(1200)).optional(),
});

const ParseQuerySchema = z.object({
  entities: z.array(EntityInputSchema).min(2).max(5),
  context: z.string().optional(),
  comparisonType: z.string().optional(),
});

type ExtractedFact = z.infer<typeof FactSchema>;
type ExtractedSource = {
  url: string;
  title: string;
  markdown: string;
  entityName: string;
};

function normalizeParsedQuery(
  data: z.infer<typeof ParseQuerySchema>,
): ParsedQuery {
  return {
    context: data.context,
    comparisonType: data.comparisonType,
    entities: data.entities.map((entity) =>
      typeof entity === "string"
        ? { name: entity }
        : { name: entity.name, type: entity.type },
    ),
  };
}

function parseQueryFallback(query: string): ParsedQuery {
  const parts = query.split(/\s+vs\.?\s+/i);

  // If no explicit "vs" separator was found, don't invent a second entity.
  // Let the job fail gracefully with a clear error.
  if (parts.length < 2) {
    return {
      entities: [{ name: query.trim() }],
      context: undefined,
      comparisonType: undefined,
    };
  }

  const [leftRaw, rightRaw = ""] = parts;
  const [rightEntityRaw, contextTail] = rightRaw.split(/\s+for\s+/i);
  const cleanName = (value: string, fallback: string) =>
    value
      .replace(/\b(for|with|inside|on|because|when)\b.*$/i, "")
      .replace(/[^a-z0-9\s+./-]/gi, "")
      .replace(/\s+/g, " ")
      .trim() || fallback;

  return {
    entities: [
      { name: cleanName(leftRaw, "Option A") },
      { name: cleanName(rightEntityRaw, "Option B") },
    ],
    context: contextTail?.trim() || undefined,
    comparisonType: contextTail?.trim() || undefined,
  };
}

function normalizeDimensionWeight(weight: number | undefined): string {
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) return "1.00";
  const normalized = numericWeight > 1 ? numericWeight / 100 : numericWeight;
  return Math.min(Math.max(normalized, 0.01), 1).toFixed(2);
}

// ─── Step Tracking ──────────────────────────────────────────────────────────

async function startStep(
  ctx: JobContext,
  aiRunId: string,
  stepName: string,
  input?: unknown,
) {
  const db = ctx.db;
  const [step] = await db
    .insert(aiRunSteps)
    .values({
      aiRunId,
      stepName,
      status: "running",
      inputSnapshot: input ?? null,
      startedAt: new Date(),
    })
    .returning();

  return step.id;
}

async function completeStep(
  ctx: JobContext,
  stepId: string,
  output?: unknown,
) {
  await ctx.db
    .update(aiRunSteps)
    .set({
      status: "completed",
      outputSnapshot: output ?? null,
      completedAt: new Date(),
    })
    .where(eq(aiRunSteps.id, stepId));
}

async function failStep(
  ctx: JobContext,
  stepId: string,
  error: string,
) {
  await ctx.db
    .update(aiRunSteps)
    .set({
      status: "failed",
      errorTrace: error,
      completedAt: new Date(),
    })
    .where(eq(aiRunSteps.id, stepId));
}

async function createAiRun(
  ctx: JobContext,
  task: string,
): Promise<string> {
  const [run] = await ctx.db
    .insert(aiRuns)
    .values({
      comparisonId: ctx.comparisonId,
      provider: ctx.provider.name,
      model: "unknown",
      task,
      status: "running",
    })
    .returning();
  return run.id;
}

async function updateAiRun(
  ctx: JobContext,
  runId: string,
  updates: {
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
    latencyMs?: number;
    status?: "running" | "completed" | "failed";
    errorMessage?: string;
    promptHash?: string;
  },
  isAiCall = true,
) {
  await ctx.db
    .update(aiRuns)
    .set({
      ...updates as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(aiRuns.id, runId));

  if (updates.estimatedCost) {
    ctx.guardrails.totalCost += updates.estimatedCost;
  }
  if (isAiCall && (updates.status === "completed" || updates.status === "failed")) {
    ctx.guardrails.aiCalls++;
  }
  checkGuardrails(ctx.guardrails);
}

async function logUsageEvent(
  ctx: JobContext,
  eventType: string,
  quantity: number,
  metadata?: Record<string, unknown>,
) {
  await ctx.db.insert(usageEvents).values({
    clerkUserId: ctx.userId,
    clerkOrgId: ctx.orgId || null,
    eventType,
    quantity,
    metadata: metadata ?? null,
  });
}

async function updateComparisonProgress(
  ctx: JobContext,
  progress: number,
  activeStep: number,
  extra: Partial<typeof comparisons.$inferInsert> = {},
) {
  await ctx.db
    .update(comparisons)
    .set({ ...extra, progress, activeStep, updatedAt: new Date() })
    .where(eq(comparisons.id, ctx.comparisonId));
}

async function clearDerivedComparisonData(
  db: ReturnType<typeof createDbClient>,
  comparisonId: string,
) {
  await db.delete(comparisonFacts).where(eq(comparisonFacts.comparisonId, comparisonId));
  await db.delete(comparisonScores).where(eq(comparisonScores.comparisonId, comparisonId));
  await db.delete(comparisonVerdicts).where(eq(comparisonVerdicts.comparisonId, comparisonId));
  await db.delete(comparisonSources).where(eq(comparisonSources.comparisonId, comparisonId));
  await db.delete(comparisonDimensions).where(eq(comparisonDimensions.comparisonId, comparisonId));
  await db.delete(comparisonEntities).where(eq(comparisonEntities.comparisonId, comparisonId));
  await db.delete(aiRuns).where(eq(aiRuns.comparisonId, comparisonId));
}

// ─── Core Pipeline Steps ────────────────────────────────────────────────────

const MAX_RETRIES = 2;

export async function runComparisonJob(
  comparisonId: string,
  userId: string,
  query: string,
  orgId?: string,
) {
  const lockKey = `job-lock:${comparisonId}`;
  const lock = await redisAcquireLockToken(lockKey, 300);
  if (!lock) {
    logger.warn("Job already running, skipping", { comparisonId });
    return;
  }

  try {
    const db = createDbClient();

    // Check retry count
    const [comp] = await db
      .select({ retryCount: comparisons.retryCount })
      .from(comparisons)
      .where(eq(comparisons.id, comparisonId))
      .limit(1);

    if (comp && comp.retryCount > MAX_RETRIES) {
      logger.warn("Max retries exceeded, marking as failed", { comparisonId, retries: comp.retryCount });
      await db
        .update(comparisons)
        .set({
          status: "failed",
          errorMessage: sql`coalesce(${comparisons.errorMessage}, ${`Failed after ${MAX_RETRIES} retry attempts.`})`,
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, comparisonId));
      return;
    }

    const provider = getPrimaryProvider();
    const taxonomy = analyzeComparisonQuery(query);
    if (!taxonomy.canStart) {
      throw new Error(taxonomy.message);
    }

    const ctx: JobContext = {
      comparisonId,
      userId,
      orgId,
      query,
      guardrails: createGuardrails(),
      provider,
      db,
      taxonomy,
    };

    // Clear previous derived rows when refreshing an existing completed/stale comparison.
    await clearDerivedComparisonData(db, comparisonId);

    // Update comparison status
    await updateComparisonProgress(ctx, 5, 0, { status: "running" });

    // Step 1: Parse query
    const parsed = await runParseStep(ctx);
    await updateComparisonProgress(ctx, 15, 1);

    // Step 2: Search for sources
    const sources = await runSearchStep(ctx, parsed.entities, parsed.context || ctx.query);
    await updateComparisonProgress(ctx, 35, 2, { sourceCount: sources.length });

    // Step 3: Extract pages
    const extracted = await runExtractionStep(ctx, sources);
    await updateComparisonProgress(ctx, 50, 3);

    // Step 4: Generate dimensions
    const dimensions = await runDimensionStep(ctx, parsed);
    await updateComparisonProgress(ctx, 60, 4);

    // Step 5: Extract facts
    const facts = await runFactStep(ctx, parsed, extracted, dimensions);
    await updateComparisonProgress(ctx, 75, 4);

    // Step 6: Score
    const scores = await runScoreStep(ctx, parsed, facts, dimensions);
    await updateComparisonProgress(ctx, 85, 5);

    // Step 7: Verdict
    const verdict = await runVerdictStep(ctx, parsed, scores, facts);
    await updateComparisonProgress(ctx, 95, 5);

    // Step 8: Build result JSON and finalize
    const [comparisonRow] = await db
      .select({
        projectId: comparisons.projectId,
        slug: comparisons.slug,
        workspaceId: comparisons.workspaceId,
      })
      .from(comparisons)
      .where(eq(comparisons.id, comparisonId))
      .limit(1);
    const result = buildResultJson(
      parsed,
      sources,
      facts,
      scores,
      verdict,
      dimensions,
      comparisonRow?.slug,
      ctx.taxonomy,
    );

    // Phase 11: Calibrate overall confidence
    const normalized = normalizeQuery(ctx.query, {
      entityA: parsed.entities[0]?.name || "Option A",
      entityB: parsed.entities[1]?.name || "Option B",
    });
    const freshnessClass = getFreshnessClass(normalized.category);
    const reliabilityScores = sources.map((s) => {
      // Compute reliability score from content
      const url = s.url || "";
      if (/\.gov|\.edu|github\.com/i.test(url)) return 1.0;
      if (/docs|documentation|api/i.test(url)) return 0.9;
      if (/reddit|stackoverflow|quora/i.test(url)) return 0.6;
      return 0.7;
    });
    const overallConfidence = calibrateConfidence({
      sourceCount: sources.length,
      sourceReliabilityScores: reliabilityScores,
      factsCount: facts.length,
      dimensionsCovered: dimensions.length,
      totalDimensions: dimensions.length,
      freshnessClass,
    });
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await embedText([
        ctx.query,
        `Entities: ${parsed.entities.map((entity) => entity.name).join(" vs ")}`,
        `Dimensions: ${dimensions.map((dimension) => dimension.name).join(", ")}`,
        `Verdict: ${getVerdictText(verdict)}`,
      ].join("\n"));
    } catch (error) {
      logger.warn("Comparison query embedding failed", {
        comparisonId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await db
      .update(comparisons)
      .set({
        status: "completed",
        progress: 100,
        activeStep: 5,
        result: result,
        taxonomyCategory: normalized.category,
        taxonomyStatus: normalized.taxonomyStatus,
        taxonomyConfidence: String(normalized.confidence),
        safetyLevel: normalized.safetyLevel,
        policyNote: normalized.policyNote || null,
        errorMessage: null,
        updatedAt: new Date(),
        totalCost: String(ctx.guardrails.totalCost),
        searchesUsed: ctx.guardrails.searchCalls,
        overallConfidence: String(overallConfidence),
        freshnessClass,
        queryEmbedding,
      })
      .where(eq(comparisons.id, comparisonId));

    comparisonCache.set(normalized.canonicalSlug, result, 10 * 60 * 1000);

    // Phase 11: Save reusable facts to entity knowledge base
    for (const rawFact of facts) {
      const fact = rawFact as { entity?: string; dimension?: string; value?: string; citation?: string; confidence?: number };
      if (!isReusableFact({ value: fact.value || "", dimension: fact.dimension || "" })) continue;
      const entityName = (fact.entity || "") as string;
      const entitySlug = normalizeEntityForReuse(entityName);
      if (!entitySlug || entitySlug.length < 2) continue;

      await db
        .insert(entityKnowledge)
        .values({
          entitySlug,
          entityDisplayName: entityName,
          dimension: (fact.dimension || "general") as string,
          value: (fact.value || "") as string,
          sourceUrl: (fact.citation || null) as string | null,
          sourceTitle: null,
          confidence: String(fact.confidence || 0.5),
          freshnessClass,
        })
        .onConflictDoUpdate({
          target: [entityKnowledge.entitySlug, entityKnowledge.dimension, entityKnowledge.value],
          set: {
            usageCount: sql`${entityKnowledge.usageCount} + 1`,
            lastVerifiedAt: new Date(),
            freshnessClass,
          },
        });
    }

    // Phase 10: Update query analytics with final data
    await db
      .update(queryAnalytics)
      .set({
        totalCost: String(ctx.guardrails.totalCost),
        searchesUsed: ctx.guardrails.searchCalls,
        sourcesFound: sources.length,
        detectedEntities: JSON.stringify(parsed.entities?.map((e: { name: string; type?: string }) => ({
          name: e.name.toLowerCase(),
          type: e.type || null,
        })) || []),
        taxonomyStatus: normalized.taxonomyStatus,
        safetyLevel: normalized.safetyLevel,
        taxonomyConfidence: String(normalized.confidence),
        policyNote: normalized.policyNote || null,
        sourceStrategy: {
          requirements: normalized.sourceRequirements,
          disclaimer: normalized.disclaimer,
        },
      })
      .where(eq(queryAnalytics.comparisonId, comparisonId));

    logger.info("Comparison job completed", {
      comparisonId,
      cost: ctx.guardrails.totalCost,
      time: Date.now() - ctx.guardrails.startTime,
    });

    // Phase 12: Insert into comparison_versions for Time Travel history
    try {
      const [versionCounter] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(comparisonVersions)
        .where(eq(comparisonVersions.comparisonId, comparisonId));

      const newVersionNum = (versionCounter?.count || 0) + 1;

      let changeSummary: Record<string, unknown> = { reason: "completed_run" };
      if (newVersionNum > 1) {
        const [prevVersion] = await db
          .select({ result: comparisonVersions.result })
          .from(comparisonVersions)
          .where(
            and(
              eq(comparisonVersions.comparisonId, comparisonId),
              eq(comparisonVersions.versionNumber, newVersionNum - 1),
            ),
          )
          .limit(1);

        if (prevVersion?.result) {
          // Find any active watchlists linked to this comparison
          const linkedWatchlists = await db
            .select({ alertThreshold: watchlists.alertThreshold })
            .from(watchlists)
            .where(
              and(
                eq(watchlists.comparisonId, comparisonId),
                eq(watchlists.status, "active"),
              ),
            );

          let alertThreshold = 0.1;
          if (linkedWatchlists.length > 0) {
            alertThreshold = Math.min(...linkedWatchlists.map((w) => Number(w.alertThreshold) || 0.1));
          }

          const diffResult = computeResultDiff(prevVersion.result, result, alertThreshold);
          changeSummary = {
            reason: "completed_run",
            diff: diffResult.diff,
            alert: diffResult.thresholdBreached ? {
              threshold: alertThreshold,
              message: `Score delta exceeded alert threshold of ${alertThreshold * 100} points.`,
            } : null,
          };
        }
      }

      await db.insert(comparisonVersions).values({
        comparisonId,
        versionNumber: newVersionNum,
        result: result,
        sourceCount: sources.length,
        overallConfidence: String(overallConfidence),
        changeSummary: changeSummary,
        createdBy: userId,
      });

      logger.info("Saved historical snapshot to comparisonVersions", {
        comparisonId,
        versionNumber: newVersionNum,
      });
    } catch (verr) {
      logger.error("Failed to save version snapshot", verr instanceof Error ? verr : undefined, {
        comparisonId,
      });
    }

    sendComparisonCompleteEmail({
      userId,
      comparisonId,
      query,
      slug: comparisonRow?.slug || comparisonId,
    }).catch((error) => {
      logger.warn("Comparison completion email failed", {
        comparisonId,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Phase 3: Trigger outgoing webhooks on success
    triggerWebhooks(db, comparisonId, "comparison.completed", { result }, safeWaitUntil).catch((err) => {
      logger.error("Failed to trigger webhook on completion", { comparisonId, error: err });
    });

    safeWaitUntil(queueSnapSolveEvent({
      clerkUserId: userId,
      eventType: "sideby.comparison.completed",
      idempotencyKey: comparisonId,
      metadata: {
        category: normalized.category,
        comparison_id: comparisonId,
        project_id: comparisonRow?.projectId ?? null,
        status: "completed",
        workspace_id: comparisonRow?.workspaceId ?? null,
      },
      workspaceId: comparisonRow?.workspaceId ?? null,
    }).catch((error) => {
      logger.warn("Failed to enqueue SnapSolve comparison event", {
        comparisonId,
        error: error instanceof Error ? error.message : String(error),
      });
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    logger.error("Comparison job failed", error instanceof Error ? error : undefined, {
      comparisonId,
    });

    const db = createDbClient();
    const [comp] = await db
      .select({ retryCount: comparisons.retryCount })
      .from(comparisons)
      .where(eq(comparisons.id, comparisonId))
      .limit(1);

    const currentRetries = comp?.retryCount || 0;

    if (currentRetries < MAX_RETRIES) {
      logger.info("Queueing retry", { comparisonId, retry: currentRetries + 1 });

      await clearDerivedComparisonData(db, comparisonId);

      await db
        .update(comparisons)
        .set({
          status: "queued",
          errorMessage: `Retry ${currentRetries + 1}/${MAX_RETRIES}: ${message}`,
          retryCount: currentRetries + 1,
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, comparisonId));
    } else {
      // Build partial result from whatever data exists
      const partialResult = await buildPartialResult(db, comparisonId);

      await db
        .update(comparisons)
        .set({
          status: "failed",
          errorMessage: `Failed after ${MAX_RETRIES} retries: ${message}`,
          result: partialResult,
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, comparisonId));

      // Phase 3: Trigger outgoing webhooks on failure
      triggerWebhooks(
        db,
        comparisonId,
        "comparison.failed",
        { error: `Failed after ${MAX_RETRIES} retries: ${message}` },
        safeWaitUntil
      ).catch((err) => {
        logger.error("Failed to trigger webhook on failure", { comparisonId, error: err });
      });

      // Phase 10: Mark query analytics for failed job
      await db
        .update(queryAnalytics)
        .set({
          totalCost: "0",
          searchesUsed: 0,
        })
        .where(eq(queryAnalytics.comparisonId, comparisonId));

      logger.info("Saved partial result for failed comparison", {
        comparisonId,
        hasPartialResult: !!partialResult,
      });
    }
  } finally {
    await redisReleaseLock(lock);
  }
}

type QueuedJobScheduler = (promise: Promise<void>) => void;

const retryBackoffMs = (retryCount: number) =>
  Math.min(60_000, Math.pow(2, Math.max(retryCount - 1, 0)) * 1000);

function isQueuedJobDue(row: { retryCount: number; updatedAt: Date }) {
  if (row.retryCount <= 0) return true;
  return Date.now() - row.updatedAt.getTime() >= retryBackoffMs(row.retryCount);
}

export async function drainQueuedComparisonJobs(
  limit = 5,
  scheduleJob?: QueuedJobScheduler,
) {
  const db = createDbClient();
  const safeLimit = Math.max(1, Math.min(limit, 10));
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const rows = await db
    .select({
      id: comparisons.id,
      query: comparisons.query,
      clerkUserId: comparisons.clerkUserId,
      clerkOrgId: comparisons.clerkOrgId,
      retryCount: comparisons.retryCount,
      updatedAt: comparisons.updatedAt,
      status: comparisons.status,
    })
    .from(comparisons)
    .where(
      or(
        eq(comparisons.status, "queued"),
        and(
          eq(comparisons.status, "running"),
          lte(comparisons.updatedAt, tenMinutesAgo)
        )
      )
    )
    .orderBy(asc(comparisons.updatedAt))
    .limit(safeLimit * 4);

  // Handle orphans first: release lock and requeue or fail
  for (const row of rows) {
    if (row.status === "running") {
      await redisForceReleaseLock(`job-lock:${row.id}`);
      if (row.retryCount < MAX_RETRIES) {
        await db
          .update(comparisons)
          .set({
            status: "queued",
            retryCount: row.retryCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(comparisons.id, row.id));
        logger.info(`Orphaned job ${row.id} reset to queued (retry ${row.retryCount + 1})`);
      } else {
        await db
          .update(comparisons)
          .set({
            status: "failed",
            errorMessage: "Job timed out and exceeded maximum retries.",
            updatedAt: new Date(),
          })
          .where(eq(comparisons.id, row.id));
        logger.error(`Orphaned job ${row.id} exceeded max retries. Marked as failed.`);
      }
    }
  }

  const dueRows = rows
    .filter(
      (row) =>
        row.status === "queued" &&
        row.clerkUserId &&
        row.retryCount <= MAX_RETRIES &&
        isQueuedJobDue(row),
    )
    .slice(0, safeLimit);

  let started = 0;
  for (const row of dueRows) {
    const job = runComparisonJob(
      row.id,
      row.clerkUserId!,
      row.query,
      row.clerkOrgId || undefined,
    ).catch((error) => {
      logger.error("Queued comparison job failed", error instanceof Error ? error : undefined, {
        comparisonId: row.id,
      });
    });

    if (scheduleJob) {
      scheduleJob(job);
    } else {
      await job;
    }
    started++;
  }

  return {
    scanned: rows.length,
    due: dueRows.length,
    started,
  };
}

// ─── Individual Steps ───────────────────────────────────────────────────────

async function runParseStep(ctx: JobContext) {
  const runId = await createAiRun(ctx, "parse_query");
  const stepId = await startStep(ctx, runId, "parse", { query: ctx.query });

  try {
    const messages = [
      {
        role: "system" as const,
        content:
          [
            "You are a query parser for SideBy.",
            "Extract only the entities being compared, the context, and the comparison type from the user's query.",
            `The preflight taxonomy category is ${ctx.taxonomy.label}; do not override safety policy or invent extra entities.`,
            "Return valid JSON only.",
          ].join(" "),
      },
      {
        role: "user" as const,
        content: `Parse this comparison query: "${ctx.query}"`,
      },
    ];

    const result = await ctx.provider.generateObject(messages, ParseQuerySchema, {
      maxTokens: 1000,
    });

    await updateAiRun(ctx, runId, {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      status: "completed",
    });

    const parsed = normalizeParsedQuery(result.data);

    await completeStep(ctx, stepId, parsed);
    await logUsageEvent(ctx, "comparison", 1, { step: "parse", comparisonId: ctx.comparisonId });

    // Store entities
    const entitiesToInsert = parsed.entities.map((entity, index) => ({
      comparisonId: ctx.comparisonId,
      position: index + 1,
      name: entity.name,
      normalizedName: entity.name,
      metadata: entity.type ? { detectedType: entity.type } : {},
    }));

    if (entitiesToInsert.length > 0) {
      await ctx.db.insert(comparisonEntities).values(entitiesToInsert);
    }

    return parsed;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Parse failed";
    const parsed = parseQueryFallback(ctx.query);

    if (parsed.entities.length >= 2) {
      logger.warn("AI parse failed, using deterministic query fallback", {
        comparisonId: ctx.comparisonId,
        error: msg,
      });
      await completeStep(ctx, stepId, { ...parsed, parser: "fallback" });
      await updateAiRun(ctx, runId, { status: "completed", errorMessage: msg });
      await logUsageEvent(ctx, "comparison", 1, {
        step: "parse_fallback",
        comparisonId: ctx.comparisonId,
      });

      const fallbackEntitiesToInsert = parsed.entities.map((entity, index) => ({
        comparisonId: ctx.comparisonId,
        position: index + 1,
        name: entity.name,
        normalizedName: entity.name,
        metadata: entity.type ? { detectedType: entity.type } : {},
      }));

      if (fallbackEntitiesToInsert.length > 0) {
        await ctx.db.insert(comparisonEntities).values(fallbackEntitiesToInsert);
      }

      return parsed;
    }

    const userMessage = "Could not identify two distinct options to compare. Try a query like 'A vs B'.";
    await failStep(ctx, stepId, userMessage);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: userMessage });
    throw new Error(userMessage);
  }
}

async function runSearchStep(
  ctx: JobContext,
  entities: ParsedEntity[],
  context?: string,
) {
  const runId = await createAiRun(ctx, "search");
  const stepId = await startStep(ctx, runId, "search", { entities });

  const allSources: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    entityName: string;
  }> = [];

  try {
    await Promise.all(
      entities.map(async (entity) => {
        checkGuardrails(ctx.guardrails);
        ctx.guardrails.searchCalls++;

        const results = await searchEntitySources(entity.name, context, ctx.taxonomy.category);
        for (const r of results) {
          allSources.push({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
            entityName: entity.name,
          });
        }
      }),
    );

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const deduped = allSources.filter((s) => {
      if (seenUrls.has(s.url)) return false;
      seenUrls.add(s.url);
      return true;
    });

    // Store sources with computed reliability
    const sourcesToInsert = deduped.map((source) => {
      const reliabilityScore = computeSourceReliability(source.url, source.title);
      return {
        comparisonId: ctx.comparisonId,
        url: source.url,
        title: source.title,
        sourceType: "web" as const,
        reliability: (reliabilityScore >= 0.9 ? "official" : reliabilityScore >= 0.7 ? "docs" : "review") as "official" | "docs" | "review",
        extractionMethod: "tavily" as const,
        fetchedAt: new Date(),
        metadata: {
          reliabilityScore,
          summary: source.content.slice(0, 500),
          entityName: source.entityName,
        },
      };
    });

    if (sourcesToInsert.length > 0) {
      await ctx.db.insert(comparisonSources).values(sourcesToInsert);
    }

    await updateAiRun(ctx, runId, {
      status: "completed",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      latencyMs: Date.now() - ctx.guardrails.startTime,
    }, false);

    await completeStep(ctx, stepId, { sourceCount: deduped.length });
    await logUsageEvent(ctx, "search", ctx.guardrails.searchCalls, {
      comparisonId: ctx.comparisonId,
    });

    return deduped;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Search failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg }, false);
    throw error;
  }
}

async function runExtractionStep(
  ctx: JobContext,
  sources: Array<{ url: string; title: string; content: string; entityName: string }>,
) {
  const runId = await createAiRun(ctx, "extract");
  const stepId = await startStep(ctx, runId, "extract", { sourceCount: sources.length });

  const extracted: Array<{
    url: string;
    title: string;
    markdown: string;
    entityName: string;
  }> = [];

  try {
    // Extract top sources with Firecrawl. If Firecrawl is not configured or a
    // scrape fails, keep the job moving with Tavily snippets instead of
    // sending the fact extractor an empty source packet.
    const selectedSources: Array<typeof sources[number]> = [];
    const selectedUrls = new Set<string>();
    const entityNames = Array.from(new Set(sources.map((s) => s.entityName).filter(Boolean)));
    const reusableFactCounts = await getReusableFactCounts(ctx, entityNames);

    for (const entityName of entityNames) {
      const sourceLimit = (reusableFactCounts.get(normalizeEntityForReuse(entityName)) || 0) >= 4 ? 1 : 3;
      for (const source of sources.filter((s) => s.entityName === entityName).slice(0, sourceLimit)) {
        if (selectedUrls.has(source.url)) continue;
        selectedUrls.add(source.url);
        selectedSources.push(source);
      }
    }

    for (const source of sources) {
      if (selectedSources.length >= 8) break;
      if (selectedUrls.has(source.url)) continue;
      selectedUrls.add(source.url);
      selectedSources.push(source);
    }

    const topUrls = selectedSources.map((s) => s.url);
    const sourcesByUrl = new Map(sources.map((s) => [s.url, s]));

    await Promise.all(
      topUrls.map(async (url) => {
        checkGuardrails(ctx.guardrails);
        const page = await extractPage(url);
        const source = sourcesByUrl.get(url);
        if (page) {
          extracted.push({
            url: page.url,
            title: page.title || source?.title || "",
            markdown: page.markdown,
            entityName: source?.entityName || "",
          });

          // Update source with extraction status
          await ctx.db
            .update(comparisonSources)
            .set({
              contentHash: page.contentHash,
            })
            .where(
              and(
                eq(comparisonSources.comparisonId, ctx.comparisonId),
                eq(comparisonSources.url, url),
              ),
            );
        } else if (source?.content) {
          extracted.push({
            url: source.url,
            title: source.title || source.url,
            markdown: source.content,
            entityName: source.entityName || "",
          });
        }
      }),
    );

    if (extracted.length === 0 && sources.length > 0) {
      for (const source of sources.slice(0, 6)) {
        if (!source.content) continue;
        extracted.push({
          url: source.url,
          title: source.title || source.url,
          markdown: source.content,
          entityName: source.entityName || "",
        });
      }
    }

    if (extracted.length === 0) {
      throw new Error("No source content could be extracted from search results.");
    }

    await updateAiRun(ctx, runId, {
      status: "completed",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      latencyMs: Date.now() - ctx.guardrails.startTime,
    }, false);

    await completeStep(ctx, stepId, { extractedCount: extracted.length });
    await logUsageEvent(ctx, "scrape", extracted.length, {
      comparisonId: ctx.comparisonId,
    });

    return extracted;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Extraction failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg }, false);
    throw error;
  }
}

async function runDimensionStep(
  ctx: JobContext,
  parsed: ParsedQuery,
) {
  const runId = await createAiRun(ctx, "dimensions");
  const stepId = await startStep(ctx, runId, "reason", { entities: parsed.entities });

  try {
    // Phase 11: Category-aware dimension generation
    const normalized = normalizeQuery(ctx.query, {
      entityA: parsed.entities[0]?.name || "Option A",
      entityB: parsed.entities[1]?.name || "Option B",
    });
    const categoryPrompt = buildDimensionPrompt(
      parsed.entities.map((e) => e.name),
      parsed.context || "",
      normalized.category,
    );

    const messages = [
      { role: "system" as const, content: categoryPrompt },
      {
        role: "user" as const,
        content: `Generate comparison dimensions for: ${parsed.entities.map((e) => e.name).join(" vs ")}${parsed.context ? ` (context: ${parsed.context})` : ""}`,
      },
    ];

    const DimensionArraySchema = z.array(DimensionSchema);
    const result = await ctx.provider.generateObject(messages, DimensionArraySchema, {
      maxTokens: 1500,
    });

    await updateAiRun(ctx, runId, {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      status: "completed",
      promptHash: hashPrompt(categoryPrompt),
    });

    await completeStep(ctx, stepId, result.data);

    const templateDimensions = getComparisonCategoryDefinition(normalized.category).defaultDimensions;
    const dimensionsToStore = result.data.length > 0 ? result.data : templateDimensions;

    // Store dimensions
    const dimsToInsert = dimensionsToStore.map((dim) => ({
      comparisonId: ctx.comparisonId,
      name: dim.name,
      description: dim.description || null,
      weight: normalizeDimensionWeight(dim.weight),
    }));

    if (dimsToInsert.length > 0) {
      await ctx.db.insert(comparisonDimensions).values(dimsToInsert);
    }

    return dimensionsToStore;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Dimension generation failed";
    const fallbackDimensions = getComparisonCategoryDefinition(ctx.taxonomy.category)
      .defaultDimensions
      .slice(0, 6);

    if (fallbackDimensions.length > 0) {
      logger.warn("Dimension generation failed, using taxonomy template", {
        comparisonId: ctx.comparisonId,
        category: ctx.taxonomy.category,
        error: msg,
      });
      await completeStep(ctx, stepId, {
        fallback: true,
        category: ctx.taxonomy.category,
        dimensions: fallbackDimensions,
        error: msg,
      });
      await updateAiRun(ctx, runId, { status: "completed", errorMessage: msg });

      const fallbackDimsToInsert = fallbackDimensions.map((dim) => ({
        comparisonId: ctx.comparisonId,
        name: dim.name,
        description: dim.description || null,
        weight: normalizeDimensionWeight(dim.weight),
      }));

      if (fallbackDimsToInsert.length > 0) {
        await ctx.db.insert(comparisonDimensions).values(fallbackDimsToInsert);
      }

      return fallbackDimensions;
    }

    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
}

async function runFactStep(
  ctx: JobContext,
  parsed: ParsedQuery,
  extracted: ExtractedSource[],
  dimensions: z.infer<typeof DimensionArraySchema>,
) {
  const runId = await createAiRun(ctx, "facts");
  const stepId = await startStep(ctx, runId, "extract", {
    entities: parsed.entities,
    sourceCount: extracted.length,
  });

  try {
    const definition = getComparisonCategoryDefinition(ctx.taxonomy.category);
    const sourceContent = extracted
      .map((e) => `### Source: ${e.title}\nURL: ${e.url}\nContent:\n${e.markdown.slice(0, 3000)}`)
      .join("\n\n---\n\n");

    const messages = [
      {
        role: "system" as const,
        content:
          [
            `You are a fact extraction engine for SideBy's ${definition.label} category.`,
            "Extract atomic, source-backed facts from the provided sources for each entity and dimension.",
            `Preferred source types: ${definition.sourceRequirements.join(", ") || "primary and reputable secondary sources"}.`,
            "Each fact must have a citation to the source URL.",
            "Do not invent values, rankings, or unsupported claims. Return valid JSON array only.",
          ].join(" "),
      },
      {
        role: "user" as const,
        content: `Entities: ${parsed.entities.map((e) => e.name).join(", ")}\n\nDimensions: ${dimensions.map((d) => d.name).join(", ")}\n\nSources:\n${sourceContent}`,
      },
    ];

    const FactArraySchema = z.array(FactSchema);
    const result = await ctx.provider.generateObject(messages, FactArraySchema, {
      maxTokens: 4000,
    });

    await updateAiRun(ctx, runId, {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      status: "completed",
    });

    await completeStep(ctx, stepId, { factCount: result.data.length });

    const reusableFacts = await loadReusableFacts(ctx, parsed, dimensions);
    const coveredFacts = ensureFactCoverage(
      [
        ...result.data.filter((fact) => fact.value.trim().length > 0),
        ...reusableFacts,
      ],
      parsed,
      dimensions,
      extracted,
    );

    // Deduplicate facts by normalized hash
    const seenHashes = new Set<string>();
    const uniqueFacts: Array<ExtractedFact & { _hash: string }> = [];

    for (const fact of coveredFacts) {
      const normalized = `${fact.entity}:${fact.dimension}:${fact.value.toLowerCase().trim().replace(/\s+/g, " ")}`;
      const hash = crypto.createHash("sha256").update(normalized).digest("hex");
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        uniqueFacts.push({ ...fact, _hash: hash });
      }
    }

    logger.info("Fact deduplication", {
      before: result.data.length,
      after: uniqueFacts.length,
      comparisonId: ctx.comparisonId,
    });

    const entityRows = await ctx.db
      .select()
      .from(comparisonEntities)
      .where(eq(comparisonEntities.comparisonId, ctx.comparisonId));
    const dimensionRows = await ctx.db
      .select()
      .from(comparisonDimensions)
      .where(eq(comparisonDimensions.comparisonId, ctx.comparisonId));
    const sourceRows = await ctx.db
      .select()
      .from(comparisonSources)
      .where(eq(comparisonSources.comparisonId, ctx.comparisonId));

    const factEmbeddings: Array<number[] | null> = uniqueFacts.map(() => null);
    try {
      const generatedEmbeddings = await embedTexts(
        uniqueFacts.map((fact) =>
          [
            `Entity: ${fact.entity}`,
            `Dimension: ${fact.dimension || "General"}`,
            `Fact: ${fact.value}`,
            fact.citation ? `Source: ${fact.citation}` : "",
          ].filter(Boolean).join("\n"),
        ),
      );
      for (const [index, embedding] of generatedEmbeddings.entries()) {
        factEmbeddings[index] = embedding;
      }
    } catch (error) {
      logger.warn("Fact embedding failed; follow-ups will use keyword fallback for these facts", {
        comparisonId: ctx.comparisonId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const entityByNormalizedName = new Map(entityRows.map(e => [e.normalizedName, e]));
    const dimensionByName = new Map(dimensionRows.map(d => [d.name, d]));
    const sourceByUrl = new Map(sourceRows.map(s => [s.url, s]));
    const sourceCache = new Map<string, typeof sourceRows[0] | undefined>();

    // Store facts in the production schema with optional pgvector embeddings.
    const factsToInsert = [];
    for (const [index, fact] of uniqueFacts.entries()) {
      const entityName = fact.entity;
      const dimensionName = fact.dimension || "General";
      const citation = fact.citation || "";
      const entityRow =
        entityByNormalizedName.get(entityName) ||
        entityRows[0];
      if (!entityRow) continue;
      const dimensionRow = dimensionByName.get(dimensionName);

      let sourceRow;
      if (sourceCache.has(citation)) {
        sourceRow = sourceCache.get(citation);
      } else {
        sourceRow = sourceByUrl.get(citation);
        if (!sourceRow && citation) {
          sourceRow = sourceRows.find((source) => citation.includes(source.url));
        }
        sourceCache.set(citation, sourceRow);
      }
      sourceRow = sourceRow || sourceRows[0];

      factsToInsert.push({
        comparisonId: ctx.comparisonId,
        entityId: entityRow.id,
        categoryId: dimensionRow?.id || null,
        sourceId: sourceRow?.id || null,
        entity: entityName,
        category: dimensionName,
        label: dimensionName,
        value: fact.value,
        sourceUrl: citation || sourceRow?.url || "#",
        sourceTitle: sourceRow?.title || "Web source",
        confidence: String(fact.confidence || 0.7),
        freshnessClass: "product",
        embedding: factEmbeddings[index],
        metadata: { factHash: fact._hash, citation },
      });
    }

    if (factsToInsert.length > 0) {
      await ctx.db.insert(comparisonFacts).values(factsToInsert);
    }

    return uniqueFacts;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Fact extraction failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
}

function ensureFactCoverage(
  facts: ExtractedFact[],
  parsed: ParsedQuery,
  dimensions: z.infer<typeof DimensionArraySchema>,
  extracted: ExtractedSource[],
): ExtractedFact[] {
  const completeFacts = [...facts];
  const hasFact = (entity: string, dimension: string) =>
    completeFacts.some(
      (fact) =>
        fact.entity.toLowerCase() === entity.toLowerCase() &&
        fact.dimension.toLowerCase() === dimension.toLowerCase() &&
        fact.value.trim().length > 0,
    );

  for (const entity of parsed.entities.slice(0, 2)) {
    for (const dimension of dimensions) {
      if (hasFact(entity.name, dimension.name)) continue;
      const fallback = buildFallbackFact(entity.name, dimension.name, extracted);
      if (fallback) completeFacts.push(fallback);
    }
  }

  return completeFacts;
}

function buildFallbackFact(
  entityName: string,
  dimensionName: string,
  extracted: ExtractedSource[],
): ExtractedFact | null {
  const entityNeedle = entityName.toLowerCase();
  const dimensionNeedle = dimensionName.toLowerCase().split(/\s+/)[0] || "";
  const source =
    extracted.find((item) => item.entityName.toLowerCase() === entityNeedle) ||
    extracted.find((item) => item.title.toLowerCase().includes(entityNeedle)) ||
    extracted.find((item) => item.markdown.toLowerCase().includes(entityNeedle));

  if (!source) return null;

  const sentences = source.markdown
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40);
  const sentence =
    sentences.find((item) => item.toLowerCase().includes(dimensionNeedle)) ||
    sentences.find((item) => item.toLowerCase().includes(entityNeedle)) ||
    sentences[0] ||
    source.markdown.replace(/\s+/g, " ").trim().slice(0, 240);

  if (!sentence) return null;

  return {
    entity: entityName,
    dimension: dimensionName,
    value: sentence.slice(0, 420),
    confidence: 0.55,
    citation: source.url,
  };
}

async function getReusableFactCounts(
  ctx: JobContext,
  entityNames: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  for (const entityName of entityNames) {
    const entitySlug = normalizeEntityForReuse(entityName);
    if (!entitySlug) continue;

    const [row] = await ctx.db
      .select({ count: sql<number>`count(*)::integer` })
      .from(entityKnowledge)
      .where(eq(entityKnowledge.entitySlug, entitySlug));

    counts.set(entitySlug, row?.count || 0);
  }

  return counts;
}

async function loadReusableFacts(
  ctx: JobContext,
  parsed: ParsedQuery,
  dimensions: z.infer<typeof DimensionArraySchema>,
): Promise<ExtractedFact[]> {
  const dimensionNames = new Set(dimensions.map((dimension) => dimension.name.toLowerCase()));
  const cachedFacts: ExtractedFact[] = [];

  for (const entity of parsed.entities.slice(0, 2)) {
    const entitySlug = normalizeEntityForReuse(entity.name);
    if (!entitySlug) continue;

    const rows = await ctx.db
      .select({
        dimension: entityKnowledge.dimension,
        value: entityKnowledge.value,
        sourceUrl: entityKnowledge.sourceUrl,
        confidence: entityKnowledge.confidence,
      })
      .from(entityKnowledge)
      .where(eq(entityKnowledge.entitySlug, entitySlug))
      .orderBy(sql`${entityKnowledge.usageCount} DESC`, sql`${entityKnowledge.lastVerifiedAt} DESC NULLS LAST`)
      .limit(12);

    for (const row of rows) {
      const dimension = row.dimension || "General";
      if (dimensionNames.size > 0 && !dimensionNames.has(dimension.toLowerCase())) continue;
      cachedFacts.push({
        entity: entity.name,
        dimension,
        value: row.value,
        confidence: Math.min(Number(row.confidence || 0.65), 0.85),
        citation: row.sourceUrl || undefined,
      });
    }
  }

  return cachedFacts;
}

async function runScoreStep(
  ctx: JobContext,
  parsed: ParsedQuery,
  facts: z.infer<typeof FactArraySchema>,
  dimensions: z.infer<typeof DimensionArraySchema>,
) {
  const runId = await createAiRun(ctx, "score");
  const stepId = await startStep(ctx, runId, "score", { factCount: facts.length });

  try {
    // Fetch source reliability for weighting
    const sourceRows = await ctx.db
      .select()
      .from(comparisonSources)
      .where(eq(comparisonSources.comparisonId, ctx.comparisonId));

    const reliabilityMap = new Map(
      sourceRows.map((s) => {
        const metadata = (s.metadata || {}) as { reliabilityScore?: number };
        return [s.url, Number(metadata.reliabilityScore || 0.7)] as const;
      }),
    );

    const factSummary = facts
      .map((f) => {
        const relWeight = reliabilityMap.get(f.citation || "") || 0.7;
        return `- ${f.entity} | ${f.dimension}: ${f.value} (confidence: ${f.confidence}, sourceReliability: ${relWeight.toFixed(2)})`;
      })
      .join("\n");

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a scoring engine. Score each entity (0-100) for each dimension based on the provided facts. Weight facts by their source reliability (higher = more trustworthy). Include rationale for each score. Return valid JSON array only.",
      },
      {
        role: "user" as const,
        content: `Entities: ${parsed.entities.map((e) => e.name).join(", ")}\n\nDimensions: ${dimensions.map((d) => d.name).join(", ")}\n\nFacts:\n${factSummary}`,
      },
    ];

    const ScoreArraySchema = z.array(ScoreSchema);
    const result = await ctx.provider.generateObject(messages, ScoreArraySchema, {
      maxTokens: 3000,
    });

    await updateAiRun(ctx, runId, {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      status: "completed",
    });

    await completeStep(ctx, stepId, { scoreCount: result.data.length });

    const entityRows = await ctx.db
      .select()
      .from(comparisonEntities)
      .where(eq(comparisonEntities.comparisonId, ctx.comparisonId));
    const dimensionRows = await ctx.db
      .select()
      .from(comparisonDimensions)
      .where(eq(comparisonDimensions.comparisonId, ctx.comparisonId));

    const entityByNormalizedName = new Map(entityRows.map(e => [e.normalizedName, e]));
    const dimensionByName = new Map(dimensionRows.map(d => [d.name, d]));

    // Store scores
    const scoresToInsert = [];
    for (const score of result.data) {
      const entityRow =
        entityByNormalizedName.get(score.entity) ||
        entityRows[0];
      const dimensionRow =
        dimensionByName.get(score.dimension) ||
        dimensionRows[0];
      if (!entityRow || !dimensionRow) continue;

      scoresToInsert.push({
        comparisonId: ctx.comparisonId,
        entityId: entityRow.id,
        dimensionId: dimensionRow.id,
        score: String(score.score),
        rationale: score.rationale,
      });
    }

    if (scoresToInsert.length > 0) {
      await ctx.db.insert(comparisonScores).values(scoresToInsert);
    }

    return result.data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Scoring failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
}

async function runVerdictStep(
  ctx: JobContext,
  parsed: ParsedQuery,
  scores: z.infer<typeof ScoreArraySchema>,
  facts: z.infer<typeof FactArraySchema>,
) {
  const runId = await createAiRun(ctx, "verdict");
  const stepId = await startStep(ctx, runId, "reason", { scoreCount: scores.length });

  try {
    const definition = getComparisonCategoryDefinition(ctx.taxonomy.category);
    const scoreSummary = scores
      .map((s) => `- ${s.entity} | ${s.dimension}: ${s.score}/100`)
      .join("\n");

    const messages = [
      {
        role: "system" as const,
        content:
          [
            `You are a comparison verdict engine for SideBy's ${definition.label} category.`,
            `Tone: ${definition.resultTone}`,
            definition.disclaimer ? `Include this caveat in the caveats field: ${definition.disclaimer}` : "",
            "Based on the scores and facts, produce a final verdict with overall winner, tradeoffs, confidence, and caveats.",
            "Do not make personalized medical, legal, financial, identity, religion, or people-ranking claims.",
            "Return valid JSON only.",
          ].filter(Boolean).join(" "),
      },
      {
        role: "user" as const,
        content: `Entities: ${parsed.entities.map((e) => e.name).join(", ")}\n\nScores:\n${scoreSummary}\n\nKey Facts:\n${facts.slice(0, 10).map((f) => `- ${f.entity}: ${f.value}`).join("\n")}`,
      },
    ];

    const result = await ctx.provider.generateObject(messages, VerdictSchema, {
      maxTokens: 2000,
    });

    await updateAiRun(ctx, runId, {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      status: "completed",
    });

    await completeStep(ctx, stepId, result.data);

    const entityRows = await ctx.db
      .select()
      .from(comparisonEntities)
      .where(eq(comparisonEntities.comparisonId, ctx.comparisonId));
    const winnerEntity = entityRows.find((entity) => entity.normalizedName === result.data.winner);
    const verdictText = getVerdictText(result.data);

    // Store verdict
    await ctx.db.insert(comparisonVerdicts).values({
      comparisonId: ctx.comparisonId,
      verdictType: "overall",
      winnerEntityId: winnerEntity?.id || null,
      title: result.data.winner ? `${result.data.winner} leads overall` : "Comparison verdict",
      body: [
        verdictText,
        result.data.tradeoffs ? `Tradeoffs: ${result.data.tradeoffs}` : "",
        result.data.caveats ? `Caveats: ${result.data.caveats}` : "",
      ].filter(Boolean).join("\n\n"),
      confidence: String(result.data.confidence ?? 0.6),
    });

    return result.data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Verdict failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
}

function getVerdictText(verdict: z.infer<typeof VerdictSchema>): string {
  return (
    verdict.overall ||
    verdict.summary ||
    verdict.verdict ||
    verdict.recommendation ||
    (verdict.winner
      ? `${verdict.winner} is the stronger option based on the available evidence.`
      : "The available evidence does not identify a clear winner.")
  );
}

// ─── Result Builder ─────────────────────────────────────────────────────────

const ENTITY_COLORS = ["#8b5cf6", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

function entityHex(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % ENTITY_COLORS.length;
  return ENTITY_COLORS[idx];
}

function makeResultSlug(a: string, b: string): string {
  return `${a}-vs-${b}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "comparison";
}

function buildVerdictSlots(
  category: string,
  winner: string | undefined,
) {
  const lead = winner || "Depends on priorities";
  const slots = {
    bestOverall: lead,
    bestValue: winner || "Depends on budget",
    developers: winner || "Depends on technical needs",
    teams: winner || "Depends on team needs",
    students: winner || "Depends on learning goals",
    powerUsers: winner || "Depends on advanced workflow",
    ecosystem: winner || "Depends on integrations",
  };

  if (category === "product") {
    return {
      ...slots,
      developers: winner || "Depends on daily use",
      teams: winner || "Depends on household or team fit",
      students: winner || "Depends on budget",
      powerUsers: winner || "Depends on advanced features",
      ecosystem: winner || "Depends on accessories and support",
    };
  }

  if (category === "place") {
    return {
      ...slots,
      bestValue: winner || "Depends on cost profile",
      developers: winner || "Depends on work setup",
      teams: winner || "Depends on relocation needs",
      students: winner || "Depends on study goals",
      powerUsers: winner || "Depends on long-stay logistics",
      ecosystem: winner || "Depends on community fit",
    };
  }

  if (category === "finance_info") {
    return {
      ...slots,
      bestValue: winner || "Depends on fees and time horizon",
      developers: winner || "Not personalized advice",
      teams: winner || "Depends on account rules",
      students: winner || "Depends on risk tolerance",
      powerUsers: winner || "Depends on tax situation",
      ecosystem: winner || "Verify official rules",
    };
  }

  if (category === "health_fitness") {
    return {
      ...slots,
      bestValue: winner || "Depends on access and adherence",
      developers: winner || "Depends on training goal",
      teams: winner || "Depends on coaching/support",
      students: winner || "Depends on beginner fit",
      powerUsers: winner || "Depends on intensity and recovery",
      ecosystem: winner || "Check safety caveats",
    };
  }

  if (category === "career" || category === "education") {
    return {
      ...slots,
      bestValue: winner || "Depends on cost and goals",
      developers: winner || "Depends on skill fit",
      teams: winner || "Depends on employer signal",
      students: winner || "Depends on learning path",
      powerUsers: winner || "Depends on long-term optionality",
      ecosystem: winner || "Depends on market demand",
    };
  }

  if (category === "politics_policy") {
    return {
      ...slots,
      bestOverall: "Depends on values and priorities",
      bestValue: "Depends on economic priorities",
      developers: "Depends on policy focus",
      teams: "Depends on governance priorities",
      students: "Depends on issue priority",
      powerUsers: "Depends on ideological alignment",
      ecosystem: "Depends on regional context",
    };
  }

  return slots;
}

function buildResultJson(
  parsed: ParsedQuery,
  sources: Array<{ url: string; title: string; content: string }>,
  facts: z.infer<typeof FactArraySchema>,
  scores: z.infer<typeof ScoreArraySchema>,
  verdict: z.infer<typeof VerdictSchema>,
  dimensions: z.infer<typeof DimensionArraySchema>,
  slugOverride?: string,
  taxonomy: ComparisonIntent = analyzeComparisonQuery(parsed.entities.map((e) => e.name).join(" vs ")),
) {
  const entityA = parsed.entities[0];
  const entityB = parsed.entities[1];
  const nameA = entityA?.name || "A";
  const nameB = entityB?.name || "B";
  const taxonomySummary = summarizeComparisonTaxonomy(taxonomy);
  const verdictSlots = buildVerdictSlots(taxonomySummary.category, verdict.winner);
  const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
  const sourceCache = new Map<string, typeof sources[0] | undefined>();

  const findSource = (citation?: string) => {
    if (!citation) return undefined;
    if (sourceCache.has(citation)) return sourceCache.get(citation);

    let match = sourceByUrl.get(citation);
    if (!match) {
      match = sources.find((source) => citation.includes(source.url) || source.url.includes(citation));
    }

    sourceCache.set(citation, match);
    return match;
  };

  return {
    slug: slugOverride || makeResultSlug(nameA, nameB),
    query: parsed.entities.map((e) => e.name).join(" vs "),
    context: parsed.context || "",
    taxonomy: taxonomySummary,
    entities: {
      a: {
        name: nameA,
        subtitle: parsed.comparisonType || parsed.context || "",
        mark: nameA[0]?.toUpperCase() || "A",
        hex: entityHex(nameA),
      },
      b: {
        name: nameB,
        subtitle: parsed.comparisonType || parsed.context || "",
        mark: nameB[0]?.toUpperCase() || "B",
        hex: entityHex(nameB),
      },
    },
    sourceCount: sources.length,
    updatedAt: new Date().toISOString(),
    verdict: {
      ...verdictSlots,
      summary: getVerdictText(verdict),
    },
    categories: dimensions.map((dim) => {
      const dimScoresMap = new Map(
        scores.filter((s) => s.dimension === dim.name).map((s) => [s.entity, s.score])
      );
      const aScore = dimScoresMap.get(entityA?.name) ?? 0;
      const bScore = dimScoresMap.get(entityB?.name) ?? 0;

      return {
        name: dim.name,
        winner: aScore > bScore ? "a" : bScore > aScore ? "b" : "tie",
        verdict: `${dim.name} comparison based on source-backed facts.`,
        facts: facts
          .filter((f) => f.dimension === dim.name)
          .map((f) => {
            const matchedSource = findSource(f.citation);
            return {
              entity: f.entity === entityA?.name ? "a" : "b",
              label: f.dimension,
              value: f.value,
              source: matchedSource?.title || f.citation || "Web sources",
              sourceUrl: f.citation || matchedSource?.url || "#",
              sourceTitle: matchedSource?.title || (f.citation ? "Cited source" : "Source"),
              confidence: f.confidence,
              freshness: taxonomySummary.safetyLevel === "informational" ? "Monitor" as const : "Fresh" as const,
              changed: false,
            };
          }),
      };
    }),
    dimensions: dimensions.map((dim) => {
      const dimScoresMap = new Map(
        scores.filter((s) => s.dimension === dim.name).map((s) => [s.entity, s.score])
      );
      return {
        subject: dim.name,
        a: dimScoresMap.get(entityA?.name) ?? 50,
        b: dimScoresMap.get(entityB?.name) ?? 50,
        fullMark: 100,
      };
    }),
    consensus: taxonomySummary.disclaimer ? [taxonomySummary.disclaimer] : [],
    contradictions: [],
    sources: sources.map((s) => ({
      title: s.title,
      url: s.url,
      reliability: computeSourceReliability(s.url, s.title) >= 0.9
        ? "Official" as const
        : computeSourceReliability(s.url, s.title) >= 0.7
          ? "Docs" as const
          : "Community" as const,
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: new Date().toISOString(),
      confidence: computeSourceReliability(s.url, s.title),
      contentHash: "",
      summary: s.content.slice(0, 300),
    })),
  };
}

// Type helpers for schema references
const DimensionArraySchema = z.array(DimensionSchema);
const FactArraySchema = z.array(FactSchema);
const ScoreArraySchema = z.array(ScoreSchema);

// ─── Partial Result Builder ─────────────────────────────────────────────────

async function buildPartialResult(
  db: ReturnType<typeof createDbClient>,
  comparisonId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const [comp] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.id, comparisonId))
      .limit(1);

    if (!comp) return null;

    const entities = await db
      .select()
      .from(comparisonEntities)
      .where(eq(comparisonEntities.comparisonId, comparisonId))
      .orderBy(comparisonEntities.position);

    const sources = await db
      .select()
      .from(comparisonSources)
      .where(eq(comparisonSources.comparisonId, comparisonId));

    const facts = await db
      .select()
      .from(comparisonFacts)
      .where(eq(comparisonFacts.comparisonId, comparisonId));

    const dims = await db
      .select()
      .from(comparisonDimensions)
      .where(eq(comparisonDimensions.comparisonId, comparisonId));

    const scores = await db
      .select()
      .from(comparisonScores)
      .where(eq(comparisonScores.comparisonId, comparisonId));

    const verdicts = await db
      .select()
      .from(comparisonVerdicts)
      .where(eq(comparisonVerdicts.comparisonId, comparisonId));

    const entityA = entities[0];
    const entityB = entities[1];

    if (!entityA || !entityB) return null;

    // Group facts by dimension for categories
    const factsByDim = new Map<string, typeof facts>();
    for (const f of facts) {
      const dimName = f.category || "General";
      if (!factsByDim.has(dimName)) factsByDim.set(dimName, []);
      factsByDim.get(dimName)!.push(f);
    }

    const dimById = new Map(dims.map(d => [d.id, d]));

    const categories = Array.from(factsByDim.entries()).map(([name, dimFacts]) => {
      const dimScoresMap = new Map(
        scores.filter((s) => {
          const dim = dimById.get(s.dimensionId);
          return dim?.name === name;
        }).map((s) => [s.entityId, s.score])
      );
      const aScore = dimScoresMap.get(entityA.id) ?? 50;
      const bScore = dimScoresMap.get(entityB.id) ?? 50;
      return {
        name,
        winner: aScore > bScore ? "a" : bScore > aScore ? "b" : "tie",
        verdict: `Partial data available (${dimFacts.length} facts)`,
        facts: dimFacts.map((f) => ({
          entity: f.entityId === entityA.id ? "a" : "b",
          label: f.label || "Fact",
          value: f.value || "No value extracted",
          source: f.sourceTitle || "Web sources",
          sourceUrl: f.sourceUrl || "#",
          sourceTitle: f.sourceTitle || "Source",
          confidence: Number(f.confidence ?? 0.5),
          freshness: "Fresh" as const,
          changed: false,
        })),
      };
    });

    const overallVerdict = verdicts.find((v) => v.body)?.body ||
      `Partial comparison: ${entityA.normalizedName} vs ${entityB.normalizedName}`;

    return {
      slug: comp.slug,
      query: comp.query,
      context: "Partial result — research did not complete",
      taxonomy: summarizeComparisonTaxonomy(analyzeComparisonQuery(comp.query)),
      entities: {
        a: {
          name: entityA.normalizedName,
          subtitle: "Research target",
          mark: entityA.normalizedName[0]?.toUpperCase() || "A",
          hex: "#8b5cf6",
        },
        b: {
          name: entityB.normalizedName,
          subtitle: "Research target",
          mark: entityB.normalizedName[0]?.toUpperCase() || "B",
          hex: "#0ea5e9",
        },
      },
      sourceCount: sources.length,
      updatedAt: new Date().toISOString(),
      verdict: {
        bestOverall: entityA.normalizedName,
        bestValue: "Unknown",
        developers: "Unknown",
        teams: "Unknown",
        students: "Unknown",
        powerUsers: "Unknown",
        ecosystem: "Unknown",
        summary: `${overallVerdict} (Partial result — research did not complete. Some data may be missing or incomplete.)`,
      },
      categories: categories.length > 0 ? categories : [{
        name: "General",
        winner: "tie" as const,
        verdict: "No structured facts extracted yet",
        facts: [],
      }],
      dimensions: dims.map((dim) => ({
        subject: dim.name,
        a: 50,
        b: 50,
        fullMark: 100,
      })),
      consensus: ["Partial research result"],
      contradictions: [],
      sources: sources.map((s) => ({
        title: s.title || s.url,
        url: s.url,
        reliability: (s.reliability === "official" ? "Official" : s.reliability === "docs" ? "Docs" : "Community") as "Official" | "Docs" | "Community",
        sourceType: s.sourceType || "web",
        extractionMethod: s.extractionMethod || "tavily",
        fetchedAt: s.fetchedAt?.toISOString() || new Date().toISOString(),
        confidence: Number(((s.metadata || {}) as { reliabilityScore?: number }).reliabilityScore || 0.7),
        contentHash: s.contentHash || "",
        summary: String(((s.metadata || {}) as { summary?: string }).summary || ""),
      })),
      completeness: "partial",
      confidence: 0.3,
    };
  } catch (e) {
    logger.warn("Failed to build partial result", { comparisonId, error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}
