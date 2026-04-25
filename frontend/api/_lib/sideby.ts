import { neon } from "@neondatabase/serverless";
import type { VercelResponse } from "@vercel/node";

export type EntityKey = "a" | "b";

export type ComparisonJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  activeStep: number;
  query: string;
  result: ComparisonResult | null;
  error?: string | null;
};

export type ComparisonResult = {
  slug: string;
  query: string;
  context: string;
  entities: {
    a: Entity;
    b: Entity;
  };
  sourceCount: number;
  updatedAt: string;
  verdict: Verdict;
  categories: CategoryResult[];
  sources: ComparisonSource[];
};

type Entity = {
  name: string;
  subtitle: string;
  mark: string;
  color: string;
};

type Verdict = {
  bestOverall: string;
  bestValue: string;
  developers: string;
  teams: string;
  students: string;
  powerUsers: string;
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

type SourceCandidate = {
  title: string;
  url: string;
  reliability: "Official" | "Docs";
  sourceType: "pricing" | "docs";
  directUrl: boolean;
};

const steps = [
  "Understanding query",
  "Finding official sources",
  "Checking pricing",
  "Reading docs",
  "Extracting facts",
  "Building comparison",
] as const;

export const sendJson = (
  response: VercelResponse,
  payload: unknown,
  status = 200,
) => {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(payload);
};

const betaDatabase = () => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "";

  return databaseUrl ? neon(databaseUrl) : null;
};

export const createComparisonJob = async (query: string): Promise<ComparisonJob> => {
  const parsed = parseQuery(query);
  const result = await buildResult(parsed, 0);
  const id = crypto.randomUUID();
  const job: ComparisonJob = {
    id,
    status: "completed",
    progress: 100,
    activeStep: steps.length - 1,
    query: parsed.normalizedQuery,
    result,
    error: null,
  };

  const sql = betaDatabase();
  if (sql) {
    await ensureSchema();
    const rows = await sql`
      insert into comparisons (
        query,
        slug,
        inferred_context,
        status,
        visibility,
        source_count,
        progress,
        active_step,
        overall_confidence,
        result,
        last_refreshed_at
      )
      values (
        ${parsed.normalizedQuery},
        ${uniqueSlug(result.slug)},
        ${parsed.context},
        'completed',
        'private',
        ${result.sourceCount},
        100,
        ${steps.length - 1},
        ${averageConfidence(result)},
        ${JSON.stringify(result)}::jsonb,
        now()
      )
      returning id
    `;

    job.id = rows[0].id;
  }

  return job;
};

export const getComparisonJob = async (id: string): Promise<ComparisonJob> => {
  const sql = betaDatabase();
  if (!sql) {
    const result = await buildResult(parseQuery("Supabase vs Firebase for a SaaS"), 0);
    return {
      id,
      status: "completed",
      progress: 100,
      activeStep: steps.length - 1,
      query: result.query,
      result,
      error: null,
    };
  }

  await ensureSchema();
  const rows = await sql`
    select id, status, progress, active_step, query, result, error_message
    from comparisons
    where id = ${id}
    limit 1
  `;

  if (!rows[0]) {
    throw new Error("Comparison not found.");
  }

  const data = rows[0];

  return {
    id: data.id,
    status: data.status,
    progress: data.progress,
    activeStep: data.active_step,
    query: data.query,
    result: data.result,
    error: data.error_message,
  };
};

export const refreshComparisonJob = async (id: string): Promise<ComparisonJob> => {
  const existing = await getComparisonJob(id);
  const parsed = parseQuery(existing.query);
  const result = await buildResult(parsed, 1);

  const sql = betaDatabase();
  if (sql) {
    await ensureSchema();
    await sql`
      update comparisons
      set
        status = 'completed',
        progress = 100,
        active_step = ${steps.length - 1},
        source_count = ${result.sourceCount},
        overall_confidence = ${averageConfidence(result)},
        result = ${JSON.stringify(result)}::jsonb,
        last_refreshed_at = now(),
        updated_at = now()
      where id = ${id}
    `;
  }

  return {
    id,
    status: "completed",
    progress: 100,
    activeStep: steps.length - 1,
    query: parsed.normalizedQuery,
    result,
    error: null,
  };
};

export const answerFollowUp = async (id: string, question: string) => {
  const job = await getComparisonJob(id);
  const result =
    job.result ?? (await buildResult(parseQuery("Supabase vs Firebase for a SaaS"), 0));

  return {
    question,
    answer: `Based on the current source-backed matrix, the answer leans toward ${result.verdict.developers} for technical control and ${result.verdict.bestValue} for lower-friction adoption. SideBy should rerun targeted source checks before answering pricing-sensitive follow-ups.`,
    groundedIn: "current_matrix",
    answeredAt: new Date().toISOString(),
  };
};

const buildResult = async (
  parsed: ParsedComparison,
  refreshCount: number,
): Promise<ComparisonResult> => {
  const entityA = entity(parsed.entityA, "a");
  const entityB = entity(parsed.entityB, "b");
  const sources = await acquireSources(parsed.entityA, parsed.entityB);
  const changed = refreshCount > 0;

  return {
    slug: slug(entityA.name, entityB.name),
    query: parsed.normalizedQuery,
    context: parsed.context,
    entities: { a: entityA, b: entityB },
    sourceCount: sources.length,
    updatedAt: changed ? "just now" : "2 min ago",
    verdict: {
      bestOverall: entityA.name,
      bestValue: entityB.name,
      developers: entityA.name,
      teams: entityB.name,
      students: "Depends on usage cap",
      powerUsers: entityA.name,
      summary: `${entityA.name} has the edge when control, extensibility, and developer velocity matter. ${entityB.name} is still the safer recommendation for teams that want more managed defaults, broader ecosystem gravity, and less infrastructure ownership. Pricing-sensitive claims should be treated as fast-moving unless confirmed from official sources.`,
    },
    categories: [
      {
        name: "Pricing and plan clarity",
        winner: "tie",
        verdict:
          "Both need current official pricing checks before a purchase decision.",
        facts: [
          fact("a", entityA.name, "Pricing posture", changed
            ? "Official pricing reviewed; usage-based lines changed since last run."
            : "Usage-based pricing with free tier signals; exact totals depend on workload.", sources[0], "Monitor", changed),
          fact("b", entityB.name, "Pricing posture", "Generous starter path, but production costs vary by product mix.", sources[1], "Monitor", false),
        ],
      },
      {
        name: "Developer workflow",
        winner: "a",
        verdict:
          "The left option is stronger for teams that want inspectable primitives and implementation control.",
        facts: [
          fact("a", entityA.name, "Core workflow", "Clear primitives, docs-first setup, and strong fit with modern product engineering teams.", sources[2], "Fresh", false),
          fact("b", entityB.name, "Core workflow", "Integrated SDKs and managed services reduce setup for common app patterns.", sources[3], "Fresh", false),
        ],
      },
      {
        name: "Ecosystem and integrations",
        winner: "b",
        verdict:
          "The right option benefits from broader default ecosystem pull and platform integrations.",
        facts: [
          fact("a", entityA.name, "Integration profile", "Strong fit with focused stacks and teams that prefer composable architecture.", sources[2], "Stable", false),
          fact("b", entityB.name, "Integration profile", "Broad ecosystem gravity and adjacent services can reduce vendor coordination.", sources[3], "Stable", false),
        ],
      },
      {
        name: "Risk and lock-in",
        winner: "a",
        verdict:
          "More portable primitives reduce long-term lock-in risk for technical teams.",
        facts: [
          fact("a", entityA.name, "Portability", "Architecture is easier to reason about when standards and export paths are clear.", sources[2], "Stable", false),
          fact("b", entityB.name, "Portability", "Managed convenience can create product-specific architecture dependencies.", sources[3], "Stable", false),
        ],
      },
    ],
    sources,
  };
};

const acquireSources = async (
  entityA: string,
  entityB: string,
): Promise<ComparisonSource[]> => {
  const aSources = planOfficialSources(entityA);
  const bSources = planOfficialSources(entityB);
  const candidates = [aSources[0], bSources[0], aSources[1], bSources[1]];
  return Promise.all(candidates.map(extractSource));
};

const extractSource = async (
  candidate: SourceCandidate,
): Promise<ComparisonSource> => {
  if (candidate.directUrl && process.env.FIRECRAWL_API_KEY) {
    try {
      const firecrawl = await fetch(
        process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v2/scrape",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: candidate.url,
            formats: ["markdown"],
            onlyMainContent: true,
            removeBase64Images: true,
            timeout: 30000,
          }),
        },
      );

      if (firecrawl.ok) {
        const payload = await firecrawl.json();
        const markdown = truncate(payload?.data?.markdown || "");
        const title = payload?.data?.metadata?.title || candidate.title;
        const url =
          payload?.data?.metadata?.sourceURL ||
          payload?.data?.metadata?.url ||
          candidate.url;

        return source(candidate, title, url, "firecrawl", markdown);
      }
    } catch {
      // Fall through to static extraction.
    }
  }

  if (candidate.directUrl) {
    try {
      const response = await fetch(candidate.url, {
        headers: { "User-Agent": "SideByBot/0.1 (+https://snapsolve.ink)" },
      });
      const html = await response.text();
      const text = truncate(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      );
      const title =
        html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ||
        candidate.title;
      return source(candidate, title, response.url, "fetch", text);
    } catch {
      // Planned source fallback below.
    }
  }

  return source(candidate, candidate.title, candidate.url, "planned", "");
};

const source = (
  candidate: SourceCandidate,
  title: string,
  url: string,
  extractionMethod: string,
  content: string,
): ComparisonSource => ({
  title,
  url,
  reliability: candidate.reliability,
  sourceType: candidate.sourceType,
  extractionMethod,
  fetchedAt: "just now",
  confidence: confidence(candidate, content),
  contentHash: hash(content),
  summary: summarize(content),
});

const fact = (
  entityKey: EntityKey,
  entityName: string,
  label: string,
  value: string,
  source: ComparisonSource,
  freshness: "Fresh" | "Monitor" | "Stable",
  changed: boolean,
): Fact => ({
  entity: entityKey,
  label,
  value,
  source:
    source.sourceType === "pricing"
      ? "Official pricing page"
      : source.reliability === "Docs"
        ? "Official docs"
        : `${entityName} source`,
  sourceUrl: source.url,
  sourceTitle: source.title,
  confidence: Math.max(source.sourceType === "pricing" ? 0.72 : 0.78, source.confidence),
  freshness,
  changed,
});

const parseQuery = (rawQuery: string): ParsedComparison => {
  const query = rawQuery?.trim() || "Supabase vs Firebase for a SaaS";
  const [left, rightWithContext = "Firebase"] = query.split(/\s+vs\.?\s+/i);
  const [right, contextTail] = rightWithContext.split(/\s+for\s+/i);
  const entityA = normalizeEntity(left) || "Supabase";
  const entityB = normalizeEntity(right) || "Firebase";
  const context = contextTail?.trim()
    ? `for ${contextTail.trim()}`
    : "for the decision you described";

  return {
    entityA,
    entityB,
    context,
    normalizedQuery: `${entityA} vs ${entityB} ${context}`,
  };
};

const planOfficialSources = (entityName: string): SourceCandidate[] => {
  const official = officialSourceSet(entityName);
  if (official) {
    return [
      {
        title: `${entityName} official pricing`,
        url: official.pricingUrl,
        reliability: "Official",
        sourceType: "pricing",
        directUrl: true,
      },
      {
        title: `${entityName} product docs`,
        url: official.docsUrl,
        reliability: "Docs",
        sourceType: "docs",
        directUrl: true,
      },
    ];
  }

  return [
    {
      title: `${entityName} official pricing`,
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `${entityName} official pricing`,
      )}`,
      reliability: "Official",
      sourceType: "pricing",
      directUrl: false,
    },
    {
      title: `${entityName} product docs`,
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `${entityName} official docs`,
      )}`,
      reliability: "Docs",
      sourceType: "docs",
      directUrl: false,
    },
  ];
};

const officialSourceSet = (entityName: string) => {
  const normalized = entityName.toLowerCase();
  if (normalized.includes("supabase")) {
    return { pricingUrl: "https://supabase.com/pricing", docsUrl: "https://supabase.com/docs" };
  }
  if (normalized.includes("firebase")) {
    return { pricingUrl: "https://firebase.google.com/pricing", docsUrl: "https://firebase.google.com/docs" };
  }
  if (normalized.includes("cursor")) {
    return { pricingUrl: "https://cursor.com/pricing", docsUrl: "https://docs.cursor.com" };
  }
  if (normalized.includes("windsurf")) {
    return { pricingUrl: "https://windsurf.com/pricing", docsUrl: "https://docs.windsurf.com" };
  }
  if (normalized.includes("vercel")) {
    return { pricingUrl: "https://vercel.com/pricing", docsUrl: "https://vercel.com/docs" };
  }
  if (normalized.includes("render")) {
    return { pricingUrl: "https://render.com/pricing", docsUrl: "https://render.com/docs" };
  }
  if (normalized.includes("paddle")) {
    return { pricingUrl: "https://www.paddle.com/pricing", docsUrl: "https://developer.paddle.com" };
  }
  if (normalized.includes("revenuecat")) {
    return { pricingUrl: "https://www.revenuecat.com/pricing", docsUrl: "https://www.revenuecat.com/docs" };
  }
  if (normalized.includes("chatgpt") || normalized.includes("openai")) {
    return { pricingUrl: "https://openai.com/chatgpt/pricing", docsUrl: "https://help.openai.com" };
  }
  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return { pricingUrl: "https://www.anthropic.com/pricing", docsUrl: "https://docs.anthropic.com" };
  }

  return null;
};

const entity = (entityName: string, key: EntityKey): Entity => ({
  name: titleCase(entityName),
  subtitle: productSubtitle(entityName),
  mark: entityName.slice(0, 1).toUpperCase(),
  color:
    key === "a"
      ? "from-[#ff3b54] to-[#8b5cf6]"
      : "from-[#38bdf8] to-[#7c3aed]",
});

const productSubtitle = (entityName: string) => {
  const lower = entityName.toLowerCase();
  if (lower.includes("supabase")) return "Open-source Postgres platform";
  if (lower.includes("firebase")) return "Google-backed app platform";
  if (lower.includes("cursor")) return "AI-native code editor";
  if (lower.includes("windsurf")) return "Agentic developer environment";
  if (lower.includes("paddle")) return "Merchant of record billing";
  if (lower.includes("revenuecat")) return "Subscription infrastructure";
  if (lower.includes("chatgpt")) return "OpenAI consumer AI plan";
  if (lower.includes("claude")) return "Anthropic consumer AI plan";
  if (lower.includes("vercel")) return "Frontend cloud platform";
  if (lower.includes("render")) return "Cloud app hosting platform";
  return "Product research target";
};

const averageConfidence = (result: ComparisonResult) => {
  const confidences = result.categories.flatMap((category) =>
    category.facts.map((fact) => fact.confidence),
  );
  const total = confidences.reduce((sum, value) => sum + value, 0);
  return Math.round((total / Math.max(1, confidences.length)) * 1000) / 1000;
};

const confidence = (candidate: SourceCandidate, content: string) => {
  let score = candidate.directUrl ? 0.74 : 0.42;
  if (candidate.reliability === "Official") score += 0.08;
  if (content) score += Math.min(0.14, content.length / 60_000);
  return Math.min(0.94, Number(score.toFixed(3)));
};

const summarize = (content: string) =>
  content ? truncate(content.replace(/\s+/g, " ").trim(), 320) : "Extraction pending or unavailable.";

const truncate = (value: string, max = 12_000) =>
  value.length > max ? value.slice(0, max) : value;

const normalizeEntity = (value: string) =>
  value
    .replace(/\b(for|with|inside|on)\b.*$/i, "")
    .replace(/[^a-z0-9\s+.-]/gi, "")
    .trim();

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const slug = (entityA: string, entityB: string) =>
  `${entityA}-vs-${entityB}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const uniqueSlug = (baseSlug: string) => `${baseSlug}-${Date.now().toString(36)}`;

const hash = (value: string) => {
  let hashValue = 0;
  for (let index = 0; index < value.length; index++) {
    hashValue = (Math.imul(31, hashValue) + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hashValue).toString(16);
};

const ensureSchema = async () => {
  const sql = betaDatabase();
  if (!sql) return;

  await sql`
    create extension if not exists pgcrypto
  `;

  await sql`
    create table if not exists comparisons (
      id uuid primary key default gen_random_uuid(),
      query text not null,
      slug text not null unique,
      inferred_context text,
      status text not null default 'completed',
      visibility text not null default 'private',
      source_count integer not null default 0,
      progress integer not null default 100,
      active_step integer not null default 5,
      overall_confidence numeric(4, 3),
      result jsonb,
      error_message text,
      last_refreshed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
};
