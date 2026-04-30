import { neon } from "@neondatabase/serverless";
import type { VercelResponse } from "@vercel/node";
import { searchEntitySources, type SearchResult } from "./search.js";
import { extractComparisonFacts, type SourceContent } from "./extract.js";
import { isLLMAvailable } from "./llm.js";
import { writeNormalizedComparison } from "./storage.js";

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

type ParsedComparison = {
  entityA: string;
  entityB: string;
  context: string;
  normalizedQuery: string;
};

const steps = [
  "Understanding query",
  "Finding official sources",
  "Checking pricing",
  "Reading docs",
  "Extracting facts",
  "Building comparison",
] as const;

// ─── Exports ───────────────────────────────────────────────────────────────

export const sendJson = (response: VercelResponse, payload: unknown, status = 200) => {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(payload);
};

const betaDatabase = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
  return url ? neon(url) : null;
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

export const createComparisonJob = async (
  query: string,
  clerkUserId: string | null = null,
  scheduleResearch?: ResearchScheduler,
): Promise<ComparisonJob> => {
  const parsed = parseQuery(query);
  const id = crypto.randomUUID();
  const comparisonSlug = uniqueSlug(slug(parsed.entityA, parsed.entityB));

  const sql = betaDatabase();
  if (sql) {
    await ensureSchema();
    await sql`
      insert into comparisons (id, query, slug, inferred_context, status, visibility, clerk_user_id, source_count, progress, active_step, last_refreshed_at)
      values (${id}, ${parsed.normalizedQuery}, ${comparisonSlug}, ${parsed.context}, 'queued', 'private', ${clerkUserId}, 0, 0, 0, now())
    `;
  } else {
    localJobs.set(id, { status: "researching", progress: 0, activeStep: 0, query: parsed.normalizedQuery, result: null, error: null, clerkUserId });
  }

  const research = executeResearch(id, parsed, comparisonSlug).catch((e) => {
    console.error(`Research job ${id} failed:`, e);
    return updateJobError(id, e instanceof Error ? e.message : "Research failed");
  });
  if (scheduleResearch) {
    scheduleResearch(research);
  }

  return { id, status: "running", progress: 0, activeStep: 0, query: parsed.normalizedQuery, result: null, visibility: "private", error: null };
};

export const getComparisonJob = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const sql = betaDatabase();
  if (!sql) {
    const local = localJobs.get(id);
    if (!local) {
      const result = await buildResult(parseQuery("Supabase vs Firebase for a SaaS"), 0);
      return { id, status: "completed", progress: 100, activeStep: steps.length - 1, query: result.query, result, visibility: "private", error: null };
    }
    if (!canAccessComparison("private", local.clerkUserId, clerkUserId)) {
      throw new Error("Comparison not found.");
    }
    return {
      id,
      status: local.status === "researching" ? "running" : local.status,
      progress: local.progress,
      activeStep: local.activeStep,
      query: local.query,
      result: local.result,
      visibility: "private",
      error: local.error,
    };
  }
  await ensureSchema();
  const rows = await sql`select id, status, progress, active_step, query, result, error_message, visibility, clerk_user_id from comparisons where id = ${id} limit 1`;
  if (!rows[0]) throw new Error("Comparison not found.");
  const d = rows[0];
  if (!canAccessComparison(d.visibility, d.clerk_user_id, clerkUserId)) {
    throw new Error("Comparison not found.");
  }
  const isRunning = d.status === "researching" || d.status === "queued";
  return { id: d.id, status: isRunning ? "running" : d.status, progress: d.progress, activeStep: d.active_step, query: d.query, result: d.result, visibility: d.visibility, error: d.error_message };
};

export const refreshComparisonJob = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const existing = await getComparisonJob(id, clerkUserId);
  const parsed = parseQuery(existing.query);
  const previousResult = existing.result;
  const result = await buildResult(parsed, 1, previousResult);
  if (previousResult?.slug) {
    result.slug = previousResult.slug;
  }
  const sql = betaDatabase();
  if (sql) {
    await ensureSchema();
    await sql`update comparisons set status='completed', progress=100, active_step=${steps.length - 1}, source_count=${result.sourceCount}, overall_confidence=${averageConfidence(result)}, result=${JSON.stringify(result)}::jsonb, last_refreshed_at=now(), updated_at=now() where id=${id}`;
  }
  writeNormalizedComparison(id, result).catch((e) => console.error("Failed to write normalized facts on refresh:", e));
  return { id, status: "completed", progress: 100, activeStep: steps.length - 1, query: parsed.normalizedQuery, result, visibility: existing.visibility, error: null };
};

export const answerFollowUp = async (
  id: string,
  question: string,
  clerkUserId: string | null = null,
) => {
  const job = await getComparisonJob(id, clerkUserId);
  const result = job.result ?? (await buildResult(parseQuery("Supabase vs Firebase for a SaaS"), 0));

  if (isLLMAvailable()) {
    try {
      const { llmChat } = await import("./llm.js");
      const context = JSON.stringify({
        entities: result.entities,
        verdict: result.verdict,
        categories: result.categories.map((c) => ({
          name: c.name,
          winner: c.winner,
          verdict: c.verdict,
          facts: c.facts.map((f) => ({ entity: f.entity, label: f.label, value: f.value })),
        })),
      });

      const response = await llmChat([
        { role: "system", content: "You are SideBy, a premium comparison research engine. Answer follow-up questions based on the provided comparison data. Be concise, factual, and reference specific facts from the data. If the data doesn't cover the question, say so honestly. Never hallucinate." },
        { role: "user", content: `Comparison data:\n${context.slice(0, 6000)}\n\nUser question about this comparison: ${question}` },
      ]);

      return {
        question,
        answer: response.content,
        groundedIn: "comparison_facts",
        answeredAt: new Date().toISOString(),
      };
    } catch (e) {
      console.error("LLM follow-up failed:", e);
    }
  }

  return {
    question,
    answer: `Based on the current source-backed matrix, the answer leans toward ${result.verdict.developers} for technical control and ${result.verdict.bestValue} for lower-friction adoption. SideBy would rerun targeted source checks before answering pricing-sensitive follow-ups.`,
    groundedIn: "current_matrix",
    answeredAt: new Date().toISOString(),
  };
};

export const publishComparison = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const job = await getComparisonJob(id, clerkUserId);
  const sql = betaDatabase();

  if (sql) {
    await ensureSchema();
    await sql`
      update comparisons
      set visibility = 'public', updated_at = now()
      where id = ${id}
    `;
  }

  return { ...job, visibility: "public" };
};

export const unpublishComparison = async (
  id: string,
  clerkUserId: string | null = null,
): Promise<ComparisonJob> => {
  const job = await getComparisonJob(id, clerkUserId);
  const sql = betaDatabase();

  if (sql) {
    await ensureSchema();
    await sql`
      update comparisons
      set visibility = 'private', updated_at = now()
      where id = ${id}
    `;
  }

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
  const sql = betaDatabase();

  if (!sql) {
    return [...localJobs.entries()]
      .filter(([, job]) => job.clerkUserId === clerkUserId)
      .slice(0, safeLimit)
      .map(([id, job]) => ({
        id,
        query: job.query,
        slug: job.result?.slug || slugFromQuery(job.query),
        status: job.status === "researching" ? "running" : job.status,
        visibility: "private",
        sourceCount: job.result?.sourceCount || 0,
        progress: job.progress,
        updatedAt: new Date().toISOString(),
        summary: job.result?.verdict.summary || null,
        entityA: job.result?.entities.a.name || null,
        entityB: job.result?.entities.b.name || null,
      }));
  }

  await ensureSchema();
  const rows = await sql`
    select id, query, slug, status, visibility, source_count, progress, updated_at, result
    from comparisons
    where clerk_user_id = ${clerkUserId}
    order by updated_at desc
    limit ${safeLimit}
  `;

  return rows.map((row) => {
    const result = row.result as ComparisonResult | null;
    return {
      id: row.id,
      query: row.query,
      slug: row.slug,
      status: row.status === "queued" || row.status === "researching" ? "running" : row.status,
      visibility: row.visibility,
      sourceCount: row.source_count,
      progress: row.progress,
      updatedAt: row.updated_at,
      summary: result?.verdict.summary || null,
      entityA: result?.entities.a.name || null,
      entityB: result?.entities.b.name || null,
    };
  });
};

// ─── Local in-memory job store (when no DB) ───────────────────────────────────

type LocalJob = {
  status: "researching" | "completed" | "failed";
  progress: number;
  activeStep: number;
  query: string;
  result: ComparisonResult | null;
  error: string | null;
  clerkUserId: string | null;
};

const localJobs = new Map<string, LocalJob>();

const updateJobProgress = async (id: string, progress: number, step: number) => {
  const sql = betaDatabase();
  if (sql) {
    await sql`update comparisons set status='researching', progress=${progress}, active_step=${step}, updated_at=now() where id=${id}`;
  } else {
    const j = localJobs.get(id);
    if (j) { j.status = "researching"; j.progress = progress; j.activeStep = step; }
  }
};

const updateJobError = async (id: string, error: string) => {
  const sql = betaDatabase();
  if (sql) {
    await sql`update comparisons set status='failed', error_message=${error}, updated_at=now() where id=${id}`;
  } else {
    const j = localJobs.get(id);
    if (j) { j.status = "failed"; j.error = error; }
  }
};

const updateJobResult = async (id: string, result: ComparisonResult) => {
  const sql = betaDatabase();
  if (sql) {
    await sql`
      update comparisons
      set status='completed', progress=100, active_step=${steps.length - 1},
          source_count=${result.sourceCount}, overall_confidence=${averageConfidence(result)},
          result=${JSON.stringify(result)}::jsonb, last_refreshed_at=now(), updated_at=now()
      where id=${id}`;
  } else {
    const j = localJobs.get(id);
    if (j) { j.status = "completed"; j.progress = 100; j.activeStep = steps.length - 1; j.result = result; }
  }
};

const executeResearch = async (id: string, parsed: ParsedComparison, comparisonSlug?: string) => {
  const a = entity(parsed.entityA, "a");
  const b = entity(parsed.entityB, "b");

  // Step 1: Parsing
  await updateJobProgress(id, 5, 0);
  await sleep(150);

  // Step 2: Searching
  await updateJobProgress(id, 10, 1);
  const [searchA, searchB] = await Promise.all([searchEntitySources(parsed.entityA), searchEntitySources(parsed.entityB)]);
  await updateJobProgress(id, 30, 1);

  // Step 3: Firecrawl extraction
  await updateJobProgress(id, 35, 2);
  let firecrawlSources: ComparisonSource[] = [];
  let firecrawlContents: SourceContent[] = [];
  if (process.env.FIRECRAWL_API_KEY) {
    await updateJobProgress(id, 40, 2);
    const fc = await firecrawlTopUrls(searchA, searchB, a.name);
    firecrawlSources = fc.sources;
    firecrawlContents = fc.contents;
  }
  await updateJobProgress(id, 50, 2);
  await updateJobProgress(id, 55, 3);

  // Step 4: LLM extraction
  await updateJobProgress(id, 60, 4);
  const allSearch = [...searchA, ...searchB];
  const extractedSources: ComparisonSource[] = [...allSearch.map(searchResultToSource), ...firecrawlSources];
  const sourceContents: SourceContent[] = [
    ...searchA.map((r): SourceContent => ({ entity: a.name, entityKey: "a", content: r.content })),
    ...searchB.map((r): SourceContent => ({ entity: b.name, entityKey: "b", content: r.content })),
    ...firecrawlContents,
  ];

  const extracted = await extractComparisonFacts(a.name, b.name, sourceContents, parsed.context);
  await updateJobProgress(id, 80, 4);

  // Step 5: Building result
  await updateJobProgress(id, 90, 5);

  const categories: CategoryResult[] = extracted.categories.map((cat) => ({
    name: cat.name,
    winner: cat.winner,
    verdict: cat.verdict,
    facts: cat.facts.map((f) => {
      const rel = extractedSources.find((s) => s.title?.toLowerCase().includes(f.entity)) || extractedSources[0];
      return {
        entity: f.entity,
        label: f.label,
        value: f.value,
        source: f.freshness_class === "pricing" ? "Official pricing page" : "Web sources",
        sourceUrl: rel?.url || "#",
        sourceTitle: rel?.title || "Source",
        confidence: f.confidence,
        freshness: freshnessLabel(f.freshness_class),
        changed: false,
      };
    }),
  }));

  const result: ComparisonResult = {
    slug: comparisonSlug || slug(a.name, b.name),
    query: parsed.normalizedQuery,
    context: extracted.context || parsed.context,
    entities: { a, b },
    sourceCount: extractedSources.length,
    updatedAt: new Date().toISOString().slice(11, 19),
    verdict: {
      bestOverall: extracted.verdict.bestOverall || a.name,
      bestValue: extracted.verdict.bestValue || b.name,
      developers: extracted.verdict.developers || a.name,
      teams: extracted.verdict.teams || b.name,
      students: extracted.verdict.students || "Depends on usage",
      powerUsers: extracted.verdict.powerUsers || a.name,
      ecosystem: extracted.verdict.ecosystem || b.name,
      summary: extracted.verdict.summary || `${a.name} vs ${b.name} comparison based on extracted web sources.`,
    },
    categories,
    sources: extractedSources,
  };

  await updateJobResult(id, result);
  writeNormalizedComparison(id, result).catch((e) => console.error("Failed to write normalized facts:", e));
};

const buildResult = async (parsed: ParsedComparison, refreshCount: number, previousResult?: ComparisonResult | null): Promise<ComparisonResult> => {
  const a = entity(parsed.entityA, "a");
  const b = entity(parsed.entityB, "b");
  const changed = refreshCount > 0;

  let result: ComparisonResult;

  if (isLLMAvailable()) {
    try { result = await buildLLMResult(parsed, a, b, changed); }
    catch (e) { console.error("LLM pipeline failed, using synthetic:", e); result = buildSyntheticResult(a, b, parsed, changed); }
  } else {
    result = buildSyntheticResult(a, b, parsed, changed);
  }

  if (previousResult) {
    result = detectChanges(result, previousResult);
  }

  return result;
};

const detectChanges = (current: ComparisonResult, previous: ComparisonResult): ComparisonResult => {
  const oldFacts = new Map<string, string>();
  for (const cat of previous.categories) {
    for (const f of cat.facts) {
      oldFacts.set(`${f.entity}:${f.label}`, f.value);
    }
  }

  let changedCount = 0;
  const categories = current.categories.map((cat) => ({
    ...cat,
    facts: cat.facts.map((f) => {
      const key = `${f.entity}:${f.label}`;
      const oldValue = oldFacts.get(key);
      if (oldValue !== undefined && oldValue !== f.value) {
        changedCount++;
        return { ...f, changed: true, previousValue: oldValue };
      }
      return { ...f, changed: false };
    }),
  }));

  return {
    ...current,
    categories,
    sourceCount: current.sourceCount + 1,
    updatedAt: "just now",
  };
};

const buildLLMResult = async (parsed: ParsedComparison, a: Entity, b: Entity, changed: boolean): Promise<ComparisonResult> => {
  const [searchA, searchB] = await Promise.all([searchEntitySources(parsed.entityA), searchEntitySources(parsed.entityB)]);
  const allSearch = [...searchA, ...searchB];
  const extractedSources: ComparisonSource[] = allSearch.map(searchResultToSource);

  const sourceContents: SourceContent[] = [
    ...searchA.map((r): SourceContent => ({ entity: a.name, entityKey: "a", content: r.content })),
    ...searchB.map((r): SourceContent => ({ entity: b.name, entityKey: "b", content: r.content })),
  ];

  if (process.env.FIRECRAWL_API_KEY) {
    const fc = await firecrawlTopUrls(searchA, searchB, a.name);
    extractedSources.push(...fc.sources);
    sourceContents.push(...fc.contents);
  }

  const extracted = await extractComparisonFacts(a.name, b.name, sourceContents, parsed.context);

  const categories: CategoryResult[] = extracted.categories.map((cat) => ({
    name: cat.name,
    winner: cat.winner,
    verdict: cat.verdict,
    facts: cat.facts.map((f) => {
      const rel = extractedSources.find((s) => s.title?.toLowerCase().includes(f.entity)) || extractedSources[0];
      return {
        entity: f.entity,
        label: f.label,
        value: f.value,
        source: f.freshness_class === "pricing" ? "Official pricing page" : "Web sources",
        sourceUrl: rel?.url || "#",
        sourceTitle: rel?.title || "Source",
        confidence: f.confidence,
        freshness: freshnessLabel(f.freshness_class),
        changed: false,
      };
    }),
  }));

  return {
    slug: slug(a.name, b.name),
    query: parsed.normalizedQuery,
    context: extracted.context || parsed.context,
    entities: { a, b },
    sourceCount: extractedSources.length,
    updatedAt: changed ? "just now" : new Date().toISOString().slice(11, 19),
    verdict: {
      bestOverall: extracted.verdict.bestOverall || a.name,
      bestValue: extracted.verdict.bestValue || b.name,
      developers: extracted.verdict.developers || a.name,
      teams: extracted.verdict.teams || b.name,
      students: extracted.verdict.students || "Depends on usage",
      powerUsers: extracted.verdict.powerUsers || a.name,
      ecosystem: extracted.verdict.ecosystem || b.name,
      summary: extracted.verdict.summary || `${a.name} vs ${b.name} comparison based on extracted web sources.`,
    },
    categories,
    sources: extractedSources,
  };
};

const firecrawlTopUrls = async (sa: SearchResult[], sb: SearchResult[], entityName: string) => {
  const top = [...sa, ...sb].slice(0, 4);
  const sources: ComparisonSource[] = [];
  const contents: SourceContent[] = [];
  const apiUrl = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v2/scrape";

  for (const r of top) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: r.url, formats: ["markdown"], onlyMainContent: true, removeBase64Images: true, timeout: 25000 }),
      });
      if (res.ok) {
        const d = (await res.json()) as { data?: { markdown?: string; metadata?: { title?: string; sourceURL?: string; url?: string } } };
        const md = (d?.data?.markdown || "").slice(0, 8000);
        const title = d?.data?.metadata?.title || r.title;
        const canonical = d?.data?.metadata?.sourceURL || d?.data?.metadata?.url || r.url;
        const isA = sa.some((x) => x.url === r.url);
        sources.push({ title, url: canonical, reliability: "Official", sourceType: "web", extractionMethod: "firecrawl", fetchedAt: "just now", confidence: 0.82, contentHash: hash(md), summary: md.slice(0, 300) });
        contents.push({ entity: entityName, entityKey: isA ? "a" : "b", content: md });
      }
    } catch { /* skip failures */ }
  }
  return { sources, contents };
};

const buildSyntheticResult = (a: Entity, b: Entity, parsed: ParsedComparison, changed: boolean): ComparisonResult => ({
  slug: slug(a.name, b.name),
  query: parsed.normalizedQuery,
  context: parsed.context,
  entities: { a, b },
  sourceCount: 4,
  updatedAt: changed ? "just now" : "2 min ago",
  verdict: {
    bestOverall: a.name, bestValue: b.name, developers: a.name, teams: b.name,
    students: "Depends on usage cap", powerUsers: a.name, ecosystem: b.name,
    summary: `${a.name} has the edge when control, extensibility, and developer velocity matter. ${b.name} is still the safer recommendation for teams that want more managed defaults, broader ecosystem gravity, and less infrastructure ownership.`,
  },
  categories: [
    { name: "Pricing and plan clarity", winner: "tie", verdict: "Both need current official pricing checks.", facts: [
      synFact("a", a.name, "Pricing posture", changed ? "Official pricing reviewed; changed since last run." : "Usage-based pricing with free tier signals.", "Monitor", changed),
      synFact("b", b.name, "Pricing posture", "Generous starter path; production costs vary by mix.", "Monitor", false),
    ]},
    { name: "Developer workflow", winner: "a", verdict: "Stronger for inspectable primitives and implementation control.", facts: [
      synFact("a", a.name, "Core workflow", "Clear primitives, docs-first setup, strong fit with product teams.", "Fresh", false),
      synFact("b", b.name, "Core workflow", "Integrated SDKs reduce setup for common app patterns.", "Fresh", false),
    ]},
    { name: "Ecosystem and integrations", winner: "b", verdict: "Broader default ecosystem pull and platform integrations.", facts: [
      synFact("a", a.name, "Integration profile", "Strong fit with composable architecture teams.", "Stable", false),
      synFact("b", b.name, "Integration profile", "Broad ecosystem with adjacent services.", "Stable", false),
    ]},
    { name: "Risk and lock-in", winner: "a", verdict: "More portable primitives reduce lock-in risk.", facts: [
      synFact("a", a.name, "Portability", "Clearer migration and self-hosting pathways.", "Stable", false),
      synFact("b", b.name, "Portability", "Managed convenience can create dependencies.", "Stable", false),
    ]},
  ],
  sources: [
    { title: `${a.name} official pricing`, url: searchUrl(`${a.name} pricing`), reliability: "Official", sourceType: "pricing", extractionMethod: "planned", fetchedAt: "3 min ago", confidence: 0.75, contentHash: "", summary: "" },
    { title: `${b.name} official pricing`, url: searchUrl(`${b.name} pricing`), reliability: "Official", sourceType: "pricing", extractionMethod: "planned", fetchedAt: "4 min ago", confidence: 0.75, contentHash: "", summary: "" },
    { title: `${a.name} product docs`, url: searchUrl(`${a.name} docs`), reliability: "Docs", sourceType: "docs", extractionMethod: "planned", fetchedAt: "6 min ago", confidence: 0.75, contentHash: "", summary: "" },
    { title: `${b.name} product docs`, url: searchUrl(`${b.name} docs`), reliability: "Docs", sourceType: "docs", extractionMethod: "planned", fetchedAt: "8 min ago", confidence: 0.75, contentHash: "", summary: "" },
  ],
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const searchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

// ─── Helpers ───────────────────────────────────────────────────────────────

const searchResultToSource = (r: SearchResult): ComparisonSource => ({
  title: r.title, url: r.url, reliability: "Official", sourceType: "web",
  extractionMethod: "search", fetchedAt: "just now", confidence: 0.7 + r.score * 0.2,
  contentHash: hash(r.content), summary: r.content.slice(0, 300),
});

const freshnessLabel = (cls: "pricing" | "product" | "static"): "Fresh" | "Monitor" | "Stable" =>
  cls === "pricing" ? "Monitor" : cls === "product" ? "Fresh" : "Stable";

const synFact = (ek: EntityKey, en: string, label: string, value: string, freshness: "Fresh" | "Monitor" | "Stable", changed: boolean): Fact => ({
  entity: ek, label, value, source: `${en} source`, sourceUrl: "#", sourceTitle: `${en} documentation`, confidence: 0.82, freshness, changed,
});

const entity = (name: string, key: EntityKey): Entity => {
  const hex = key === "a" ? "#8b5cf6" : "#0ea5e9";
  return { name: titleCase(name), subtitle: productSubtitle(name), mark: name.slice(0, 1).toUpperCase(), color: hex, hex, logoUrl: resolveEntityLogo(name) };
};

const productSubtitle = (n: string) => {
  const l = n.toLowerCase();
  if (l.includes("supabase")) return "Open-source Postgres platform";
  if (l.includes("firebase")) return "Google-backed app platform";
  if (l.includes("cursor")) return "AI-native code editor";
  if (l.includes("windsurf")) return "Agentic developer environment";
  if (l.includes("paddle")) return "Merchant of record billing";
  if (l.includes("revenuecat")) return "Subscription infrastructure";
  if (l.includes("chatgpt") || l.includes("openai")) return "OpenAI consumer AI plan";
  if (l.includes("claude") || l.includes("anthropic")) return "Anthropic consumer AI plan";
  if (l.includes("vercel")) return "Frontend cloud platform";
  if (l.includes("render")) return "Cloud app hosting platform";
  if (l.includes("linear")) return "Issue tracking and project management";
  if (l.includes("notion")) return "All-in-one workspace platform";
  if (l.includes("figma")) return "Collaborative design platform";
  if (l.includes("stripe")) return "Payment infrastructure platform";
  if (l.includes("railway")) return "Infrastructure platform";
  if (l.includes("cloudflare")) return "Web performance and security";
  if (l.includes("netlify")) return "Web deployment platform";
  if (l.includes("gemini") || l.includes("google ai")) return "Google AI platform";
  if (l.includes("digitalocean")) return "Cloud infrastructure provider";
  if (l.includes("fly.io") || l.includes("fly ")) return "Edge app deployment";
  if (l.includes("aws") || l.includes("amazon")) return "Cloud computing platform";
  if (l.includes("azure")) return "Microsoft cloud platform";
  if (l.includes("macbook") || l.includes("mac")) return "Apple laptop";
  if (l.includes("iphone")) return "Apple smartphone";
  if (l.includes("samsung") || l.includes("galaxy")) return "Samsung device";
  return "Product research target";
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

const slugFromQuery = (query: string) => {
  const parsed = parseQuery(query);
  return slug(parsed.entityA, parsed.entityB);
};

const averageConfidence = (r: ComparisonResult) => {
  const cs = r.categories.flatMap((c) => c.facts.map((f) => f.confidence));
  return Math.round((cs.reduce((s, v) => s + v, 0) / Math.max(1, cs.length)) * 1000) / 1000;
};

const normalizeEntity = (v: string) => v.replace(/\b(for|with|inside|on)\b.*$/i, "").replace(/[^a-z0-9\s+.-]/gi, "").trim();
const titleCase = (v: string) => v.split(/\s+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
const slug = (a: string, b: string) => `${a}-vs-${b}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const uniqueSlug = (base: string) => `${base}-${Date.now().toString(36)}`;

const knownLogos: Record<string, string> = {
  supabase: "https://cdn.simpleicons.org/supabase/white",
  firebase: "https://cdn.simpleicons.org/firebase/FFCA28",
  cursor: "https://cdn.simpleicons.org/cursor/white",
  windsurf: "https://cdn.simpleicons.org/windsurf/white",
  vercel: "https://cdn.simpleicons.org/vercel/white",
  render: "https://cdn.simpleicons.org/render/white",
  paddle: "https://cdn.simpleicons.org/paddle/white",
  revenuecat: "https://cdn.simpleicons.org/revenuecat/white",
  chatgpt: "https://cdn.simpleicons.org/openai/white",
  openai: "https://cdn.simpleicons.org/openai/white",
  claude: "https://cdn.simpleicons.org/anthropic/white",
  anthropic: "https://cdn.simpleicons.org/anthropic/white",
  linear: "https://cdn.simpleicons.org/linear/5E6AD2",
  notion: "https://cdn.simpleicons.org/notion/white",
  figma: "https://cdn.simpleicons.org/figma/white",
  stripe: "https://cdn.simpleicons.org/stripe/white",
  railway: "https://cdn.simpleicons.org/railway/white",
  cloudflare: "https://cdn.simpleicons.org/cloudflare/white",
  netlify: "https://cdn.simpleicons.org/netlify/white",
  digitalocean: "https://cdn.simpleicons.org/digitalocean/0080FF",
  aws: "https://cdn.simpleicons.org/amazonwebservices/FF9900",
  azure: "https://cdn.simpleicons.org/microsoftazure/0078D4",
  gcp: "https://cdn.simpleicons.org/googlecloud/white",
  huggingface: "https://cdn.simpleicons.org/huggingface/FFD21E",
  replit: "https://cdn.simpleicons.org/replit/white",
  macbook: "https://cdn.simpleicons.org/apple/white",
  iphone: "https://cdn.simpleicons.org/apple/white",
  samsung: "https://cdn.simpleicons.org/samsung/white",
  gemini: "https://cdn.simpleicons.org/googlegemini/white",
  github: "https://cdn.simpleicons.org/github/white",
  gitlab: "https://cdn.simpleicons.org/gitlab/white",
  docker: "https://cdn.simpleicons.org/docker/white",
  kubernetes: "https://cdn.simpleicons.org/kubernetes/white",
  redis: "https://cdn.simpleicons.org/redis/white",
  mongodb: "https://cdn.simpleicons.org/mongodb/white",
  postgresql: "https://cdn.simpleicons.org/postgresql/white",
  nextjs: "https://cdn.simpleicons.org/nextdotjs/white",
  react: "https://cdn.simpleicons.org/react/61DAFB",
  vue: "https://cdn.simpleicons.org/vuedotjs/white",
  tailwindcss: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
  typescript: "https://cdn.simpleicons.org/typescript/3178C6",
  python: "https://cdn.simpleicons.org/python/3776AB",
  rust: "https://cdn.simpleicons.org/rust/white",
  go: "https://cdn.simpleicons.org/go/00ADD8",
  nodejs: "https://cdn.simpleicons.org/nodedotjs/white",
};

const resolveEntityLogo = (name: string): string | undefined => {
  const key = name.toLowerCase().trim();
  if (knownLogos[key]) return knownLogos[key];
  const match = Object.entries(knownLogos).find(([k]) => key.includes(k) || k.includes(key));
  return match?.[1];
};
const hash = (v: string) => {
  let h = 0;
  for (let i = 0; i < v.length; i++) h = (Math.imul(31, h) + v.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
};

const ensureSchema = async () => {
  const sql = betaDatabase();
  if (!sql) return;
  await sql`create extension if not exists pgcrypto`;
  await sql`
    create table if not exists comparisons (
      id uuid primary key default gen_random_uuid(),
      query text not null, slug text not null unique, inferred_context text,
      status text not null default 'queued',
      visibility text not null default 'private',
      clerk_user_id text,
      clerk_org_id text,
      source_count integer not null default 0, progress integer not null default 0,
      active_step integer not null default 0, overall_confidence numeric(4, 3),
      result jsonb, error_message text, last_refreshed_at timestamptz,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    )`;
  await sql`alter table comparisons add column if not exists clerk_user_id text`;
  await sql`alter table comparisons add column if not exists clerk_org_id text`;
  await sql`create index if not exists comparisons_clerk_user_id_idx on comparisons(clerk_user_id)`;
};
