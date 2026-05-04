import type { VercelResponse } from "@vercel/node";
import { eq, desc, and } from "drizzle-orm";
import { createDbClient } from "../../src/db/index";
import { comparisons, aiRuns, aiRunSteps } from "../../src/db/schema";
import { runComparisonJob } from "./job-engine";
import { logger } from "./log";

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
};

export type ComparisonResult = {
  slug: string;
  query: string;
  context: string;
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
  response.setHeader("Cache-Control", "no-store");
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
  if (!isPrivateOwnershipRequired() && !ownerId) return true;
  return Boolean(ownerId && clerkUserId && ownerId === clerkUserId);
};

export interface CreateComparisonInput {
  query: string;
  userId: string;
  orgId?: string;
  workspaceId?: string;
  projectId?: string;
}

export const createComparisonJob = async (
  input: CreateComparisonInput,
  scheduleResearch?: ResearchScheduler,
): Promise<ComparisonJob> => {
  const parsed = parseQuery(input.query);
  const id = crypto.randomUUID();
  const comparisonSlug = uniqueSlug(slug(parsed.entityA, parsed.entityB));

  const db = createDbClient();

  await db.insert(comparisons).values({
    id,
    query: parsed.normalizedQuery,
    slug: comparisonSlug,
    status: "queued",
    visibility: "private",
    clerkUserId: input.userId,
    clerkOrgId: input.orgId || null,
    workspaceId: input.workspaceId || null,
    projectId: input.projectId || null,
    progress: 0,
    activeStep: 0,
    sourceCount: 0,
  });

  const research = runComparisonJob(id, input.userId, input.query, input.orgId).catch((e) => {
    logger.error(`Research job ${id} failed`, e instanceof Error ? e : undefined, { comparisonId: id });
  });

  if (scheduleResearch) {
    scheduleResearch(research);
  } else {
    research.catch(() => {});
  }

  return { id, status: "running", progress: 0, activeStep: 0, query: parsed.normalizedQuery, result: null, visibility: "private", error: null };
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

  const isRunning = d.status === "researching" || d.status === "queued";

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

  return {
    id: d.id,
    status: isRunning ? "running" : d.status,
    progress: d.progress,
    activeStep: d.activeStep,
    query: d.query,
    result: d.result as ComparisonResult | null,
    visibility: d.visibility,
    error: d.errorMessage,
    failedStep,
    retryable: d.status === "failed" && (d.retryCount || 0) < 2,
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
    .select()
    .from(comparisons)
    .where(eq(comparisons.clerkUserId, clerkUserId))
    .orderBy(desc(comparisons.updatedAt))
    .limit(safeLimit);

  return rows.map((row) => {
    const result = row.result as ComparisonResult | null;
    return {
      id: row.id,
      query: row.query,
      slug: row.slug,
      status: row.status === "queued" || row.status === "researching" ? "running" : row.status,
      visibility: row.visibility,
      sourceCount: row.sourceCount,
      progress: row.progress,
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
      summary: result?.verdict.summary || null,
      entityA: result?.entities.a.name || null,
      entityB: result?.entities.b.name || null,
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

const parseQuery = (raw: string): ParsedComparison => {
  const q = raw?.trim() || "Supabase vs Firebase for a SaaS";
  const [left, rest = "Firebase"] = q.split(/\s+vs\.?\s+/i);
  const [right, ctx] = rest.split(/\s+for\s+/i);
  const ea = normalizeEntity(left) || "Supabase";
  const eb = normalizeEntity(right) || "Firebase";
  const context = ctx?.trim() ? `for ${ctx.trim()}` : q.toLowerCase().includes("saas") ? "for a SaaS product" : "for the decision you described";
  return { entityA: ea, entityB: eb, context, normalizedQuery: `${ea} vs ${eb} ${context}` };
};

const normalizeEntity = (v: string) => v.replace(/\b(for|with|inside|on)\b.*$/i, "").replace(/[^a-z0-9\s+.-]/gi, "").trim();
const slug = (a: string, b: string) => `${a}-vs-${b}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const uniqueSlug = (base: string) => `${base}-${Date.now().toString(36)}`;
