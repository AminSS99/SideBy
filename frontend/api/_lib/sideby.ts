import type { VercelResponse } from "@vercel/node";
import { z } from "zod";
import { eq, desc, and, asc, or, sql, gt, isNull, inArray } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import { comparisons, aiRuns, aiRunSteps, comparisonEntities, comparisonFacts, comparisonSources, queryAnalytics } from "../../src/db/schema.js";
import { runComparisonJob } from "./job-engine.js";
import { getPrimaryProvider } from "./providers/index.js";
import { logger } from "./log.js";
import { normalizeQuery } from "./query-normalizer.js";
import { isFreshEnough, isStaleButUsable, getFreshnessClass, freshnessLabel } from "./reuse-engine.js";
import { comparisonCache, trackCacheHit } from "./cache-layer.js";
import {
  assessPublishEligibility,
  isRetrievableCitation,
  AUTHORIZED_INPUT_SCOPE,
  type ServerEvidence,
} from "./public-eligibility.js";

/**
 * Load the server-written evidence used to classify a record's publish
 * eligibility: the generation-time input scope, completed pipeline runs,
 * per-fact citation quality from the normalized extraction tables, and the
 * pipeline's own source inventory. Never derived from the stored JSON and
 * never taken from the request.
 */
export const loadPublishEvidence = async (
  db: ReturnType<typeof createDbClient>,
  comparisonId: string,
): Promise<ServerEvidence> => {
  const [comparisonRow, runs, facts, sources] = await Promise.all([
    db
      .select({ inputScope: comparisons.inputScope })
      .from(comparisons)
      .where(eq(comparisons.id, comparisonId))
      .limit(1),
    db
      .select({ status: aiRuns.status })
      .from(aiRuns)
      .where(eq(aiRuns.comparisonId, comparisonId)),
    db
      .select({ sourceUrl: comparisonFacts.sourceUrl })
      .from(comparisonFacts)
      .where(eq(comparisonFacts.comparisonId, comparisonId)),
    db
      .select({ url: comparisonSources.url, canonicalUrl: comparisonSources.canonicalUrl })
      .from(comparisonSources)
      .where(eq(comparisonSources.comparisonId, comparisonId)),
  ]);

  let citedFactCount = 0;
  let uncitedFactCount = 0;
  for (const fact of facts) {
    if (isRetrievableCitation(fact.sourceUrl)) citedFactCount += 1;
    else uncitedFactCount += 1;
  }

  const sourceInventory = new Set<string>();
  for (const source of sources) {
    if (typeof source.url === "string" && source.url) sourceInventory.add(source.url);
    if (typeof source.canonicalUrl === "string" && source.canonicalUrl) {
      sourceInventory.add(source.canonicalUrl);
    }
  }

  return {
    inputScope: comparisonRow[0]?.inputScope ?? null,
    pipelineRunPresent: runs.some((run) => run.status === "completed"),
    citedFactCount,
    uncitedFactCount,
    sourceInventory: Array.from(sourceInventory),
  };
};
import {
  redisAcquireLockToken,
  redisReleaseLock,
  redisRenewLockToken,
  redisVerifyLockToken,
  type RedisLock,
} from "./redis.js";
import {
  canAccessComparison as canAccessComparisonRecord,
  canAccessProject,
  canAccessWorkspace,
  canMutateComparison,
} from "./db-auth.js";
import {
  analyzeComparisonQuery,
  summarizeComparisonTaxonomy,
  type ComparisonTaxonomySummary,
} from "../../src/lib/comparisonTaxonomy.js";
import { validateComparisonQuery } from "./comparison-validator.js";

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
  sourcesFound?: number;
  factsExtracted?: number;
  dimensionsScored?: number;
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
  isFavorited: boolean;
  folder: string | null;
  tags: string[];
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

// ─── Exports ─────────────────────────────────────────────────────────────────

// Server errors must never leak SQL, parameters, hostnames, or stack text.
const INTERNAL_ERROR_PATTERN =
  /failed query|params:|\b(select|insert|update|delete)\b[\s\S]*\b(from|into|set)\b|relation ".+" does not exist|column ".+"|\becon\w+|password|postgres|neon\.tech|at\s+\S+\s+\(.*:\d+:\d+\)/i;

export const sanitizeErrorPayload = (payload: unknown, status: number): unknown => {
  if (status < 500 || !payload || typeof payload !== "object") return payload;
  const record = payload as Record<string, unknown>;
  const message = record.error;
  if (typeof message !== "string") return payload;
  if (message.length <= 300 && !INTERNAL_ERROR_PATTERN.test(message)) return payload;
  console.error("Suppressed internal error detail from API response", message.slice(0, 2000));
  return { ...record, error: "Something went wrong on our side. Please try again in a moment." };
};

export const sendJson = (response: VercelResponse, payload: unknown, status = 200) => {
  if (!response.hasHeader("Cache-Control")) {
    response.setHeader("Cache-Control", "no-store");
  }
  return response.status(status).json(sanitizeErrorPayload(payload, status));
};

/**
 * Serializes a job-creation failure through existing error conventions,
 * including the `Retry-After` delay for retryable contention outcomes
 * (e.g. COMPARISON_IN_PROGRESS when the intent lock is unavailable).
 */
/**
 * Database-enforced deduplication claim for one in-flight comparison intent.
 * The same derivation feeds the lock scope, the partial unique index
 * `comparisons_intent_inflight_uniq`, and the violation fallback lookup, so a
 * lock that expires between verification and the INSERT still cannot create
 * a duplicate: the second INSERT fails atomically with 23505.
 */
export const buildComparisonIntentKey = (
  userId: string,
  workspaceId: string | null | undefined,
  projectId: string | null | undefined,
  canonicalSlug: string,
): string =>
  [userId, workspaceId || "-", projectId || "-", canonicalSlug].join("\n");

/** Postgres unique violation, whether raised directly or wrapped by a driver. */
export const isUniqueViolationError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  if ((error as { code?: unknown }).code === "23505") return true;
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate key value violates unique constraint/i.test(message);
};

export const sendJobError = (response: VercelResponse, error: unknown, fallbackMessage: string) => {
  const status =
    error instanceof Error && "statusCode" in error
      ? (error as Error & { statusCode: number }).statusCode
      : 500;
  const code =
    error instanceof Error && "code" in error && typeof (error as Error & { code: unknown }).code === "string"
      ? (error as Error & { code: string }).code
      : undefined;
  const retryAfter =
    error instanceof Error && "retryAfter" in error
      ? (error as Error & { retryAfter: unknown }).retryAfter
      : undefined;
  if (typeof retryAfter === "number" && Number.isFinite(retryAfter) && retryAfter > 0) {
    response.setHeader("Retry-After", String(Math.ceil(retryAfter)));
  }
  return sendJson(
    response,
    {
      error: error instanceof Error ? error.message : fallbackMessage,
      ...(code ? { code } : {}),
    },
    status,
  );
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
    intentKey: buildComparisonIntentKey(
      params.input.userId,
      params.input.workspaceId,
      params.input.projectId,
      params.normalized.canonicalSlug,
    ),
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

const findActiveInFlightComparison = async (
  db: ReturnType<typeof createDbClient>,
  userId: string,
  canonicalSlug: string,
  workspaceId?: string | null,
  projectId?: string | null,
) => {
  const conditions = [
    eq(comparisons.clerkUserId, userId),
    eq(queryAnalytics.canonicalSlug, canonicalSlug),
    or(eq(comparisons.status, "queued"), eq(comparisons.status, "running")),
    gt(comparisons.createdAt, new Date(Date.now() - 120_000)),
  ];

  if (workspaceId) {
    conditions.push(eq(comparisons.workspaceId, workspaceId));
  } else {
    conditions.push(isNull(comparisons.workspaceId));
  }

  if (projectId) {
    conditions.push(eq(comparisons.projectId, projectId));
  } else {
    conditions.push(isNull(comparisons.projectId));
  }

  const rows = await db
    .select({
      id: comparisons.id,
      status: comparisons.status,
      progress: comparisons.progress,
      activeStep: comparisons.activeStep,
      query: comparisons.query,
      result: comparisons.result,
      visibility: comparisons.visibility,
      errorMessage: comparisons.errorMessage,
    })
    .from(comparisons)
    .innerJoin(queryAnalytics, eq(comparisons.id, queryAnalytics.comparisonId))
    .where(and(...conditions))
    .orderBy(desc(comparisons.createdAt))
    .limit(1);

  return rows[0];
};

export const createComparisonJob = async (
  input: CreateComparisonInput,
  scheduleResearch?: ResearchScheduler,
): Promise<ComparisonJob> => {
  // The workspace and project ids come from the caller; never trust them
  // without checking the caller can write there (blocks cross-tenant inserts).
  if (input.workspaceId || input.projectId) {
    const accessDb = createDbClient();
    if (input.workspaceId && !(await canAccessWorkspace(accessDb, input.userId, input.workspaceId))) {
      throw Object.assign(new Error("Workspace not found."), { statusCode: 404 });
    }
    if (input.projectId && !(await canAccessProject(accessDb, input.userId, input.projectId))) {
      throw Object.assign(new Error("Project not found."), { statusCode: 404 });
    }
  }

  const { intent } = await validateComparisonQuery(input.query);
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
  const intentKey = buildComparisonIntentKey(
    input.userId,
    input.workspaceId,
    input.projectId,
    normalized.canonicalSlug,
  );

  const db = createDbClient();
  const freshnessClass = getFreshnessClass(normalized.category);

  // ─── Phase 10.5: In-flight duplicate intent prevention (Atomic & Scoped) ─────
  // Scoped strictly by (userId, workspaceId, projectId, canonicalSlug).
  // Uses a distributed lock to serialize concurrent submissions and prevent duplicate parallel jobs.
  // No new-job insertion or pipeline scheduling may happen without holding
  // this lock: exhausted retries produce an explicit retryable 409 instead of
  // falling through to unprotected insertion.
  const scopeKey = `${input.userId}:${input.workspaceId || "none"}:${input.projectId || "none"}:${normalized.canonicalSlug}`;
  const lockKey = `job-intent-lock:${scopeKey}`;

  let lock = await redisAcquireLockToken(lockKey, 30);
  if (!lock) {
    // A concurrent submission is actively holding the lock.
    // Poll briefly to check if it creates the record.
    for (let attempt = 0; attempt < 4; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      const existing = await findActiveInFlightComparison(
        db,
        input.userId,
        normalized.canonicalSlug,
        input.workspaceId,
        input.projectId,
      );
      if (existing) {
        logger.info("Reusing in-flight comparison job after concurrent lock wait", {
          comparisonId: existing.id,
          canonicalSlug: normalized.canonicalSlug,
        });
        return {
          id: existing.id,
          status: existing.status as ComparisonJob["status"],
          progress: existing.progress ?? 0,
          activeStep: existing.activeStep ?? 0,
          query: existing.query,
          result: existing.result as ComparisonResult | null,
          visibility: (existing.visibility as ComparisonJob["visibility"]) ?? "private",
          error: existing.errorMessage ?? null,
        };
      }
      lock = await redisAcquireLockToken(lockKey, 30);
      if (lock) break;
    }
  }

  if (!lock) {
    // Lock never became available and no job appeared: never fall through to
    // unprotected insertion (that path created duplicates). This also covers
    // lock-storage outages — there is no silent unsafe fallback.
    const lateWinner = await findActiveInFlightComparison(
      db,
      input.userId,
      normalized.canonicalSlug,
      input.workspaceId,
      input.projectId,
    ).catch(() => undefined);
    if (lateWinner) {
      logger.info("Reusing in-flight comparison job after lock exhaustion", {
        comparisonId: lateWinner.id,
        canonicalSlug: normalized.canonicalSlug,
      });
      return {
        id: lateWinner.id,
        status: lateWinner.status as ComparisonJob["status"],
        progress: lateWinner.progress ?? 0,
        activeStep: lateWinner.activeStep ?? 0,
        query: lateWinner.query,
        result: lateWinner.result as ComparisonResult | null,
        visibility: (lateWinner.visibility as ComparisonJob["visibility"]) ?? "private",
        error: lateWinner.errorMessage ?? null,
      };
    }
    throw Object.assign(
      new Error("Another comparison request is still starting. Please try again in a moment."),
      { statusCode: 409, code: "COMPARISON_IN_PROGRESS", retryAfter: 2 },
    );
  }

  // Active lock heartbeat: keeps the lease fresh during slow requests so
  // processing never outlives the 30-second TTL and lets concurrent races slip in.
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let lockLost = false;

  const startHeartbeat = (activeLock: RedisLock) => {
    heartbeatTimer = setInterval(async () => {
      try {
        const renewed = await redisRenewLockToken(activeLock, 30);
        if (!renewed) {
          lockLost = true;
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        }
      } catch {
        // Transient network issue, next heartbeat interval will retry
      }
    }, 10_000);
  };

  startHeartbeat(lock);

  const verifyLockStillHeld = async () => {
    if (lockLost || !(await redisVerifyLockToken(lock))) {
      logger.warn("Lock ownership lost or expired during comparison job preparation", {
        lockKey,
        canonicalSlug: normalized.canonicalSlug,
      });
      const existingAfterLoss = await findActiveInFlightComparison(
        db,
        input.userId,
        normalized.canonicalSlug,
        input.workspaceId,
        input.projectId,
      );
      if (existingAfterLoss) {
        return existingAfterLoss;
      }
      throw Object.assign(
        new Error("Comparison lock expired during job setup. Please retry."),
        { statusCode: 409, code: "COMPARISON_IN_PROGRESS", retryAfter: 2 },
      );
    }
    return null;
  };

  try {
    // ─── Phase 12: In-memory cache check ─────────────────────────────────────
    // Runs inside the lock so even instant cache hits serialize per scope and
    // never bypass the concurrency guarantee with unguarded inserts.
    const memoryHit = comparisonCache.get<ComparisonResult>(normalized.canonicalSlug);
    if (memoryHit) {
      logger.info("Memory cache hit", { canonicalSlug: normalized.canonicalSlug });
      const result = materializeCachedResult(memoryHit, comparisonSlug, parsed.normalizedQuery);

      const lostJob = await verifyLockStillHeld();
      if (lostJob) {
        return {
          id: lostJob.id,
          status: lostJob.status as ComparisonJob["status"],
          progress: lostJob.progress ?? 0,
          activeStep: lostJob.activeStep ?? 0,
          query: lostJob.query,
          result: lostJob.result as ComparisonResult | null,
          visibility: (lostJob.visibility as ComparisonJob["visibility"]) ?? "private",
          error: lostJob.errorMessage ?? null,
        };
      }

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

    const existing = await findActiveInFlightComparison(
      db,
      input.userId,
      normalized.canonicalSlug,
      input.workspaceId,
      input.projectId,
    );

    if (existing) {
      logger.info("Reusing in-flight comparison job for duplicate intent", {
        comparisonId: existing.id,
        canonicalSlug: normalized.canonicalSlug,
      });
      return {
        id: existing.id,
        status: existing.status as ComparisonJob["status"],
        progress: existing.progress ?? 0,
        activeStep: existing.activeStep ?? 0,
        query: existing.query,
        result: existing.result as ComparisonResult | null,
        visibility: (existing.visibility as ComparisonJob["visibility"]) ?? "private",
        error: existing.errorMessage ?? null,
      };
    }

    // ─── Phase 11: True Result Reuse ──────────────────────────────────────────
    const reusedSource = await findReusableComparison(db, input, normalized);
    const isCached = reusedSource && isFreshEnough(reusedSource.updatedAt, normalized.category);
    const canServeStale =
      reusedSource && !isCached && isStaleButUsable(reusedSource.updatedAt, normalized.category);

    const lostJob = await verifyLockStillHeld();
    if (lostJob) {
      return {
        id: lostJob.id,
        status: lostJob.status as ComparisonJob["status"],
        progress: lostJob.progress ?? 0,
        activeStep: lostJob.activeStep ?? 0,
        query: lostJob.query,
        result: lostJob.result as ComparisonResult | null,
        visibility: (lostJob.visibility as ComparisonJob["visibility"]) ?? "private",
        error: lostJob.errorMessage ?? null,
      };
    }

    // Uniqueness guarantee: final in-flight check immediately before insert
    const inFlightBeforeInsert = await findActiveInFlightComparison(
      db,
      input.userId,
      normalized.canonicalSlug,
      input.workspaceId,
      input.projectId,
    );
    if (inFlightBeforeInsert) {
      logger.info("Reusing in-flight comparison job discovered immediately before insert", {
        comparisonId: inFlightBeforeInsert.id,
        canonicalSlug: normalized.canonicalSlug,
      });
      return {
        id: inFlightBeforeInsert.id,
        status: inFlightBeforeInsert.status as ComparisonJob["status"],
        progress: inFlightBeforeInsert.progress ?? 0,
        activeStep: inFlightBeforeInsert.activeStep ?? 0,
        query: inFlightBeforeInsert.query,
        result: inFlightBeforeInsert.result as ComparisonResult | null,
        visibility: (inFlightBeforeInsert.visibility as ComparisonJob["visibility"]) ?? "private",
        error: inFlightBeforeInsert.errorMessage ?? null,
      };
    }

    // Create the comparison record. The INSERT itself is the final atomic
    // arbiter: if the distributed lock expired between verification and this
    // write, a concurrent winner's row trips the partial unique index
    // (comparisons_intent_inflight_uniq) and this branch adopts the winner
    // instead of scheduling a duplicate pipeline.
    let insertConflictWinner: Awaited<ReturnType<typeof findActiveInFlightComparison>> | undefined =
      undefined;
    try {
      await db.insert(comparisons).values({
        id,
        query: parsed.normalizedQuery,
        slug: comparisonSlug,
        intentKey,
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
    } catch (error) {
      if (!isUniqueViolationError(error)) throw error;
      logger.warn("Comparison insert hit in-flight uniqueness; adopting winner", {
        intentKey,
        canonicalSlug: normalized.canonicalSlug,
      });
      insertConflictWinner = await findActiveInFlightComparison(
        db,
        input.userId,
        normalized.canonicalSlug,
        input.workspaceId,
        input.projectId,
      );
      if (!insertConflictWinner) {
        // Winner already finished between the conflict and this lookup; let
        // the client retry into the reuse path rather than inserting again.
        throw Object.assign(
          new Error("Another comparison request just created this job. Please try again in a moment."),
          { statusCode: 409, code: "COMPARISON_IN_PROGRESS", retryAfter: 2 },
        );
      }
    }

    if (insertConflictWinner) {
      const winner = insertConflictWinner;
      return {
        id: winner.id,
        status: winner.status as ComparisonJob["status"],
        progress: winner.progress ?? 0,
        activeStep: winner.activeStep ?? 0,
        query: winner.query,
        result: winner.result as ComparisonResult | null,
        visibility: (winner.visibility as ComparisonJob["visibility"]) ?? "private",
        error: winner.errorMessage ?? null,
      };
    }

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
          .catch((e) => {
            logger.warn("Failed to queue background refresh", { error: String(e) });
          });
        logger.info(`[DISABLE_IN_PROCESS_JOBS] Background refresh for source ${reusedSource.id} queued for external worker.`);
      } else {
        const bgRefresh = runComparisonJob(reusedSource.id, input.userId, input.query, input.orgId).catch((e) => {
          logger.warn(`Background refresh failed for ${reusedSource!.id}`, { error: e instanceof Error ? e.message : String(e) });
        });
        if (scheduleResearch) scheduleResearch(bgRefresh);
        else bgRefresh.catch((e) => {
          logger.error("Unscheduled background refresh failed", e instanceof Error ? e : undefined);
        });
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
  } finally {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (lock) {
      await redisReleaseLock(lock).catch((err) => {
        logger.warn("Failed to release comparison submission lock", { lockKey, error: String(err) });
      });
    }
  }
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
  const hasAccess = await canAccessComparisonRecord(db, clerkUserId, id);
  if (!hasAccess) {
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
    sourcesFound: d.sourceCount,
    factsExtracted: d.factsCount,
    dimensionsScored: d.dimensionsCount,
  };
};

export const publishComparison = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const db = createDbClient();
  if (!clerkUserId || !(await canMutateComparison(db, clerkUserId, id))) {
    throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });
  }

  const job = await getComparisonJob(id, clerkUserId);

  // Server-authoritative privacy: classification comes from pipeline-written
  // evidence (runs + normalized fact citations), never the stored JSON.
  const eligibility = assessPublishEligibility(
    job.result,
    await loadPublishEvidence(db, id),
  );
  if (!eligibility.eligible) {
    throw Object.assign(new Error(eligibility.reasons.join(" ")), {
      statusCode: 422,
      reasons: eligibility.reasons,
    });
  }

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
  const db = createDbClient();
  if (!clerkUserId || !(await canMutateComparison(db, clerkUserId, id))) {
    throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });
  }

  const job = await getComparisonJob(id, clerkUserId);

  await db
    .update(comparisons)
    .set({ visibility: "private", updatedAt: new Date() })
    .where(eq(comparisons.id, id));

  return { ...job, visibility: "private" };
};

export type PublicSnapshotResult = {
  id: string;
  slug: string;
  query: string;
  status: "queued" | "running" | "completed" | "failed";
  existing: boolean;
  sourceId: string;
};

/**
 * Generate a dedicated PUBLIC SNAPSHOT of an existing completed comparison.
 *
 * The snapshot is generated from authorized public inputs only: the server
 * itself constructs the research query from the source record's frozen
 * entity names ("A vs B"). No user-written context, brief, priorities,
 * uploads or notes ever enter the pipeline for this record — no field
 * stripping or text scanning pretended otherwise — and the row is stamped
 * `input_scope = 'public'` by the server at creation. The full pipeline runs
 * fresh (cache/reuse materialization must not inherit another record's
 * content into a publishable record).
 *
 * Private-context comparisons cannot be made public directly. This is the
 * deliberately small enforceable path between "support the workspace" and
 * "publish to everyone".
 */
export const createPublicSnapshotComparison = async (
  sourceId: string,
  clerkUserId: string | null = null,
  scheduleResearch?: ResearchScheduler,
): Promise<PublicSnapshotResult> => {
  const db = createDbClient();
  if (!clerkUserId || !(await canMutateComparison(db, clerkUserId, sourceId))) {
    throw Object.assign(new Error("Comparison not found."), { statusCode: 404 });
  }

  const [sourceRow] = await db
    .select({
      id: comparisons.id,
      status: comparisons.status,
      result: comparisons.result,
      clerkUserId: comparisons.clerkUserId,
      clerkOrgId: comparisons.clerkOrgId,
      workspaceId: comparisons.workspaceId,
      projectId: comparisons.projectId,
    })
    .from(comparisons)
    .where(and(eq(comparisons.id, sourceId), eq(comparisons.clerkUserId, clerkUserId)))
    .limit(1);

  if (!sourceRow || sourceRow.status !== "completed" || !sourceRow.result) {
    throw Object.assign(
      new Error("The comparison must finish researching before a public snapshot can be generated."),
      { statusCode: 422, code: "SNAPSHOT_NOT_READY" },
    );
  }

  // Frozen entity names are the snapshot's entire input. They come from the
  // pipeline-written comparison_entities rows (or the result's entity block
  // as a fallback) — never re-parsed from user text.
  const entityRows = await db
    .select({ name: comparisonEntities.name, position: comparisonEntities.position })
    .from(comparisonEntities)
    .where(eq(comparisonEntities.comparisonId, sourceId))
    .orderBy(asc(comparisonEntities.position))
    .limit(2);

  let nameA = entityRows[0]?.name ?? "";
  let nameB = entityRows[1]?.name ?? "";

  if (!nameA || !nameB) {
    const resultEntities = (sourceRow.result as { entities?: { a?: { name?: unknown }; b?: { name?: unknown } } } | null)
      ?.entities;
    const fromResultA = typeof resultEntities?.a?.name === "string" ? resultEntities.a.name : "";
    const fromResultB = typeof resultEntities?.b?.name === "string" ? resultEntities.b.name : "";
    nameA = nameA || fromResultA;
    nameB = nameB || fromResultB;
  }

  nameA = nameA.trim().slice(0, 120);
  nameB = nameB.trim().slice(0, 120);

  if (!nameA || !nameB || nameA.toLowerCase() === nameB.toLowerCase()) {
    throw Object.assign(
      new Error("This record can't produce a public snapshot: it needs two distinct recorded options."),
      { statusCode: 422, code: "SNAPSHOT_NO_ENTITIES" },
    );
  }

  // Idempotency: never stack duplicate paid runs for the same source record.
  // A completed snapshot is returned as-is; regenerating deliberately starts
  // from a failed attempt instead of duplicating a live one.
  const [existingSnapshot] = await db
    .select({
      id: comparisons.id,
      slug: comparisons.slug,
      query: comparisons.query,
      status: comparisons.status,
    })
    .from(comparisons)
    .where(
      and(
        eq(comparisons.publicSnapshotSourceId, sourceId),
        inArray(comparisons.status, ["queued", "running", "completed"]),
        eq(comparisons.inputScope, AUTHORIZED_INPUT_SCOPE),
      ),
    )
    .orderBy(desc(comparisons.createdAt))
    .limit(1);

  if (existingSnapshot) {
    return {
      id: existingSnapshot.id,
      slug: existingSnapshot.slug,
      query: existingSnapshot.query,
      status: existingSnapshot.status as PublicSnapshotResult["status"],
      existing: true,
      sourceId,
    };
  }

  // The snapshot's entire input: frozen entity names, server-constructed.
  const snapshotQuery = `${nameA} vs ${nameB}`;
  const normalized = normalizeQuery(snapshotQuery, {
    entityA: nameA,
    entityB: nameB,
  });
  const snapshotId = crypto.randomUUID();
  const snapshotSlug = uniqueSlug(slug(nameA, nameB));
  // Distinct intent scope: a snapshot never adopts (or collides with) the
  // user's regular in-flight intents; it has its own atomic uniqueness.
  const snapshotIntentKey = buildComparisonIntentKey(
    clerkUserId,
    sourceRow.workspaceId,
    sourceRow.projectId,
    `public-snapshot:${normalized.canonicalSlug}`,
  );

  let insertConflictWinner: { id: string; slug: string; query: string; status: string } | undefined;
  try {
    await db.insert(comparisons).values({
      id: snapshotId,
      query: snapshotQuery,
      slug: snapshotSlug,
      intentKey: snapshotIntentKey,
      taxonomyCategory: normalized.category,
      taxonomyStatus: normalized.taxonomyStatus,
      taxonomyConfidence: String(normalized.confidence),
      safetyLevel: normalized.safetyLevel,
      policyNote: normalized.policyNote || null,
      status: "queued",
      visibility: "private",
      inputScope: AUTHORIZED_INPUT_SCOPE,
      publicSnapshotSourceId: sourceId,
      clerkUserId: clerkUserId,
      clerkOrgId: sourceRow.clerkOrgId ?? null,
      workspaceId: sourceRow.workspaceId ?? null,
      projectId: sourceRow.projectId ?? null,
      progress: 0,
      activeStep: 0,
      freshnessClass: getFreshnessClass(normalized.category),
    });
  } catch (error) {
    if (!isUniqueViolationError(error)) throw error;
    logger.warn("Public snapshot insert hit in-flight uniqueness; adopting the existing snapshot", {
      comparisonId: sourceId,
      canonicalSlug: normalized.canonicalSlug,
    });
    const [winnerRow] = await db
      .select({ id: comparisons.id, slug: comparisons.slug, query: comparisons.query, status: comparisons.status })
      .from(comparisons)
      .where(eq(comparisons.intentKey, snapshotIntentKey))
      .limit(1);
    insertConflictWinner = winnerRow;
    if (!insertConflictWinner) {
      throw Object.assign(
        new Error("A public snapshot for this comparison is starting. Try again in a moment."),
        { statusCode: 409, code: "SNAPSHOT_IN_PROGRESS", retryAfter: 2 },
      );
    }
  }

  if (insertConflictWinner) {
    return {
      id: insertConflictWinner.id,
      slug: insertConflictWinner.slug,
      query: insertConflictWinner.query,
      status: insertConflictWinner.status as PublicSnapshotResult["status"],
      existing: true,
      sourceId,
    };
  }

  await db.insert(queryAnalytics).values({
    comparisonId: snapshotId,
    // rawQuery is the server-constructed entity pair, not user text.
    rawQuery: snapshotQuery,
    normalizedQuery: normalized.normalizedQuery,
    canonicalSlug: normalized.canonicalSlug,
    detectedEntities: JSON.stringify([
      { name: nameA, type: null },
      { name: nameB, type: null },
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
    reusedFromId: sourceId,
  });

  logger.info("Public snapshot job queued (entity-pair input, server-constructed)", {
    comparisonId: snapshotId,
    sourceId,
    canonicalSlug: normalized.canonicalSlug,
  });

  // Always a fresh full pipeline run: no reuse, no cache materialization.
  if (process.env.DISABLE_IN_PROCESS_JOBS === "true") {
    logger.info(`[DISABLE_IN_PROCESS_JOBS] Public snapshot job ${snapshotId} queued for external worker.`);
  } else {
    const worker = runComparisonJob(
      snapshotId,
      clerkUserId,
      snapshotQuery,
      sourceRow.clerkOrgId ?? undefined,
    ).catch((e) => {
      logger.error(
        `Public snapshot job ${snapshotId} failed`,
        e instanceof Error ? e : undefined,
        { comparisonId: snapshotId },
      );
    });
    if (scheduleResearch) {
      scheduleResearch(worker);
    } else {
      worker.catch(() => {});
    }
  }

  return {
    id: snapshotId,
    slug: snapshotSlug,
    query: snapshotQuery,
    status: "queued",
    existing: false,
    sourceId,
  };
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
      isFavorited: comparisons.isFavorited,
      folder: comparisons.folder,
      tags: comparisons.tags,
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
      isFavorited: row.isFavorited,
      folder: row.folder,
      tags: Array.isArray(row.tags)
        ? row.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
