/**
 * SideBy Comparison Job Engine
 * Manages job lifecycle: queued → searching → extracting → reasoning → completed/failed
 * Persists every step in ai_runs / ai_run_steps.
 * Enforces cost/time guardrails per job.
 */
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
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
} from "../../src/db/schema.js";
import { getPrimaryProvider } from "./providers/index.js";
import { searchEntitySources } from "./search.js";
import { extractPage } from "./firecrawl.js";
import { redisAcquireLock, redisReleaseLock } from "./redis.js";
import { logger } from "./log.js";
import { embedText, embedTexts } from "./embeddings.js";
import type { AIProvider } from "./ai-adapter.js";
import crypto from "crypto";
import { buildDimensionPrompt, calibrateConfidence, getFreshnessClass, isReusableFact, normalizeEntityForReuse } from "./reuse-engine.js";
import { normalizeQuery } from "./query-normalizer.js";
import { hashPrompt } from "./cache-layer.js";

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
}

// ─── Zod Schemas for AI Outputs ─────────────────────────────────────────────

const EntitySchema = z.object({
  name: z.string(),
  type: z.string().optional(),
});

const EntityInputSchema = z.union([EntitySchema, z.string().min(1)]);

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
  name: z.string(),
  description: z.string().optional(),
  weight: z.number().default(1),
});

const FactSchema = z.object({
  entity: z.string(),
  dimension: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  citation: z.string().optional(),
});

const ScoreSchema = z.object({
  entity: z.string(),
  dimension: z.string(),
  score: z.number().min(0).max(100),
  rationale: z.string(),
});

const VerdictSchema = z.object({
  overall: z.string(),
  winner: z.string().optional(),
  tradeoffs: z.string(),
  confidence: z.number().min(0).max(1),
  caveats: z.string().optional(),
  personas: z.record(z.string()).optional(),
});

const ParseQuerySchema = z.object({
  entities: z.array(EntityInputSchema).min(2).max(5),
  context: z.string().optional(),
  comparisonType: z.string().optional(),
});

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
  const acquired = await redisAcquireLock(lockKey, 300);
  if (!acquired) {
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

    if (comp && comp.retryCount >= MAX_RETRIES) {
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
    const ctx: JobContext = {
      comparisonId,
      userId,
      orgId,
      query,
      guardrails: createGuardrails(),
      provider,
      db,
    };

    // Update comparison status
    await updateComparisonProgress(ctx, 5, 0, { status: "running" });

    // Step 1: Parse query
    const parsed = await runParseStep(ctx);
    await updateComparisonProgress(ctx, 15, 1);

    // Step 2: Search for sources
    const sources = await runSearchStep(ctx, parsed.entities);
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
    const result = buildResultJson(parsed, sources, facts, scores, verdict, dimensions);

    // Phase 11: Calibrate overall confidence
    const normalized = normalizeQuery(ctx.query);
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

    await db
      .update(comparisons)
      .set({
        status: "completed",
        progress: 100,
        activeStep: 5,
        result: result,
        updatedAt: new Date(),
        totalCost: String(ctx.guardrails.totalCost),
        searchesUsed: ctx.guardrails.searchCalls,
        overallConfidence: String(overallConfidence),
        freshnessClass,
      })
      .where(eq(comparisons.id, comparisonId));

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
      })
      .where(eq(queryAnalytics.comparisonId, comparisonId));

    logger.info("Comparison job completed", {
      comparisonId,
      cost: ctx.guardrails.totalCost,
      time: Date.now() - ctx.guardrails.startTime,
    });
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
      // Schedule retry with exponential backoff
      const backoffMs = Math.pow(2, currentRetries) * 1000;
      logger.info("Scheduling retry", { comparisonId, retry: currentRetries + 1, backoffMs });

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

      // Keep retries inside the same awaited background task. Serverless
      // platforms can stop loose timers after the function responds.
      await redisReleaseLock(lockKey);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return runComparisonJob(comparisonId, userId, query, orgId);
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
    await redisReleaseLock(lockKey);
  }
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
          "You are a query parser. Extract the entities being compared, the context, and the comparison type from the user's query. Return valid JSON only.",
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
    for (const [index, entity] of parsed.entities.entries()) {
      await ctx.db.insert(comparisonEntities).values({
        comparisonId: ctx.comparisonId,
        position: index + 1,
        name: entity.name,
        normalizedName: entity.name,
        metadata: entity.type ? { detectedType: entity.type } : {},
      });
    }

    return parsed;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Parse failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
}

async function runSearchStep(
  ctx: JobContext,
  entities: ParsedEntity[],
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
    for (const entity of entities) {
      checkGuardrails(ctx.guardrails);
      ctx.guardrails.searchCalls++;

      const results = await searchEntitySources(entity.name);
      for (const r of results) {
        allSources.push({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          entityName: entity.name,
        });
      }
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const deduped = allSources.filter((s) => {
      if (seenUrls.has(s.url)) return false;
      seenUrls.add(s.url);
      return true;
    });

    // Store sources with computed reliability
    for (const source of deduped) {
      const reliabilityScore = computeSourceReliability(source.url, source.title);
      await ctx.db.insert(comparisonSources).values({
        comparisonId: ctx.comparisonId,
        url: source.url,
        title: source.title,
        sourceType: "web",
        reliability: reliabilityScore >= 0.9 ? "official" : reliabilityScore >= 0.7 ? "docs" : "review",
        extractionMethod: "tavily",
        fetchedAt: new Date(),
        metadata: {
          reliabilityScore,
          summary: source.content.slice(0, 500),
          entityName: source.entityName,
        },
      });
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
    const topUrls = sources.slice(0, 4).map((s) => s.url);

    for (const url of topUrls) {
      checkGuardrails(ctx.guardrails);
      const page = await extractPage(url);
      const source = sources.find((s) => s.url === url);
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
    }

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
    const normalized = normalizeQuery(ctx.query);
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

    // Store dimensions
    for (const dim of result.data) {
      await ctx.db.insert(comparisonDimensions).values({
        comparisonId: ctx.comparisonId,
        name: dim.name,
        description: dim.description || null,
        weight: String(dim.weight || 1),
      });
    }

    return result.data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Dimension generation failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
}

async function runFactStep(
  ctx: JobContext,
  parsed: ParsedQuery,
  extracted: Array<{ url: string; title: string; markdown: string; entityName: string }>,
  dimensions: z.infer<typeof DimensionArraySchema>,
) {
  const runId = await createAiRun(ctx, "facts");
  const stepId = await startStep(ctx, runId, "extract", {
    entities: parsed.entities,
    sourceCount: extracted.length,
  });

  try {
    const sourceContent = extracted
      .map((e) => `### Source: ${e.title}\nURL: ${e.url}\nContent:\n${e.markdown.slice(0, 3000)}`)
      .join("\n\n---\n\n");

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a fact extraction engine. Extract atomic facts from the provided sources for each entity and dimension. Each fact must have a citation to the source URL. Return valid JSON array only.",
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

    // Deduplicate facts by normalized hash
    const seenHashes = new Set<string>();
    const uniqueFacts: Array<Record<string, unknown>> = [];

    for (const fact of result.data) {
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

    // Store facts in the production schema. Embeddings remain optional for
    // follow-ups; the answer engine can fall back to confidence/source ranking.
    for (const fact of uniqueFacts as Array<Record<string, unknown>>) {
      const entityName = String(fact.entity || "");
      const dimensionName = String(fact.dimension || "General");
      const citation = String(fact.citation || "");
      const entityRow =
        entityRows.find((entity) => entity.normalizedName === entityName) ||
        entityRows[0];
      if (!entityRow) continue;
      const dimensionRow = dimensionRows.find((dimension) => dimension.name === dimensionName);
      const sourceRow =
        sourceRows.find((source) => source.url === citation) ||
        sourceRows.find((source) => citation && citation.includes(source.url)) ||
        sourceRows[0];

      await ctx.db.insert(comparisonFacts).values({
        comparisonId: ctx.comparisonId,
        entityId: entityRow.id,
        categoryId: dimensionRow?.id || null,
        sourceId: sourceRow?.id || null,
        entity: entityName,
        category: dimensionName,
        label: dimensionName,
        value: String(fact.value || ""),
        sourceUrl: citation || sourceRow?.url || "#",
        sourceTitle: sourceRow?.title || "Web source",
        confidence: String(fact.confidence || 0.7),
        freshnessClass: "product",
        metadata: { factHash: fact._hash, citation },
      });
    }

    return uniqueFacts;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Fact extraction failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
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

    // Store scores
    for (const score of result.data) {
      const entityRow =
        entityRows.find((entity) => entity.normalizedName === score.entity) ||
        entityRows[0];
      const dimensionRow =
        dimensionRows.find((dimension) => dimension.name === score.dimension) ||
        dimensionRows[0];
      if (!entityRow || !dimensionRow) continue;
      await ctx.db.insert(comparisonScores).values({
        comparisonId: ctx.comparisonId,
        entityId: entityRow.id,
        dimensionId: dimensionRow.id,
        score: String(score.score),
        rationale: score.rationale,
      });
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
    const scoreSummary = scores
      .map((s) => `- ${s.entity} | ${s.dimension}: ${s.score}/100`)
      .join("\n");

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a comparison verdict engine. Based on the scores and facts, produce a final verdict with overall winner, tradeoffs, confidence, and caveats. Return valid JSON only.",
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

    // Store verdict
    await ctx.db.insert(comparisonVerdicts).values({
      comparisonId: ctx.comparisonId,
      verdictType: "overall",
      winnerEntityId: winnerEntity?.id || null,
      title: result.data.winner ? `${result.data.winner} leads overall` : "Comparison verdict",
      body: [
        result.data.overall,
        result.data.tradeoffs ? `Tradeoffs: ${result.data.tradeoffs}` : "",
        result.data.caveats ? `Caveats: ${result.data.caveats}` : "",
      ].filter(Boolean).join("\n\n"),
      confidence: String(result.data.confidence),
    });

    return result.data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Verdict failed";
    await failStep(ctx, stepId, msg);
    await updateAiRun(ctx, runId, { status: "failed", errorMessage: msg });
    throw error;
  }
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

function buildResultJson(
  parsed: ParsedQuery,
  sources: Array<{ url: string; title: string; content: string }>,
  facts: z.infer<typeof FactArraySchema>,
  scores: z.infer<typeof ScoreArraySchema>,
  verdict: z.infer<typeof VerdictSchema>,
  dimensions: z.infer<typeof DimensionArraySchema>,
) {
  const entityA = parsed.entities[0];
  const entityB = parsed.entities[1];
  const nameA = entityA?.name || "A";
  const nameB = entityB?.name || "B";

  return {
    query: parsed.entities.map((e) => e.name).join(" vs "),
    context: parsed.context || "",
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
      bestOverall: verdict.winner || "",
      bestValue: verdict.winner || "",
      developers: verdict.winner || "",
      teams: verdict.winner || "",
      students: "Depends on usage",
      powerUsers: verdict.winner || "",
      ecosystem: verdict.winner || "",
      summary: verdict.overall,
    },
    categories: dimensions.map((dim) => {
      const dimScores = scores.filter((s) => s.dimension === dim.name);
      const aScore = dimScores.find((s) => s.entity === entityA?.name)?.score ?? 0;
      const bScore = dimScores.find((s) => s.entity === entityB?.name)?.score ?? 0;

      return {
        name: dim.name,
        winner: aScore > bScore ? "a" : bScore > aScore ? "b" : "tie",
        verdict: `${dim.name} comparison based on source-backed facts.`,
        facts: facts
          .filter((f) => f.dimension === dim.name)
          .map((f) => ({
            entity: f.entity === entityA?.name ? "a" : "b",
            label: f.dimension,
            value: f.value,
            source: f.citation || "Web sources",
            sourceUrl: "#",
            sourceTitle: "Source",
            confidence: f.confidence,
            freshness: "Fresh" as const,
            changed: false,
          })),
      };
    }),
    dimensions: dimensions.map((dim) => {
      const dimScores = scores.filter((s) => s.dimension === dim.name);
      return {
        subject: dim.name,
        a: dimScores.find((s) => s.entity === entityA?.name)?.score ?? 50,
        b: dimScores.find((s) => s.entity === entityB?.name)?.score ?? 50,
        fullMark: 100,
      };
    }),
    consensus: [],
    contradictions: [],
    sources: sources.map((s) => ({
      title: s.title,
      url: s.url,
      reliability: "Official" as const,
      sourceType: "web",
      extractionMethod: "tavily",
      fetchedAt: new Date().toISOString(),
      confidence: 0.75,
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

    const categories = Array.from(factsByDim.entries()).map(([name, dimFacts]) => {
      const dimScores = scores.filter((s) => {
        const dim = dims.find((d) => d.id === s.dimensionId);
        return dim?.name === name;
      });
      const aScore = dimScores.find((s) => s.entityId === entityA.id)?.score ?? 50;
      const bScore = dimScores.find((s) => s.entityId === entityB.id)?.score ?? 50;
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
