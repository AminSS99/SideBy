/**
 * Tavily Search Adapter with Redis caching and source deduplication.
 */
import { redisGet, redisSet } from "./redis.js";
import { logger } from "./log.js";
import {
  getComparisonCategoryDefinition,
  type ComparisonCategory,
} from "../../src/lib/comparisonTaxonomy.js";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = process.env.TAVILY_API_URL || "https://api.tavily.com/search";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  rawContent?: string;
}

export interface SearchParams {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeRawContent?: boolean;
}

const OFFICIAL_DOMAIN_HINTS: Record<string, string[]> = {
  paddle: ["paddle.com", "developer.paddle.com"],
  stripe: ["stripe.com", "docs.stripe.com"],
  supabase: ["supabase.com"],
  firebase: ["firebase.google.com", "cloud.google.com"],
  react: ["react.dev"],
  vue: ["vuejs.org"],
  cursor: ["cursor.com", "docs.cursor.com"],
  windsurf: ["windsurf.com", "docs.windsurf.com"],
  vercel: ["vercel.com"],
  render: ["render.com"],
  chatgpt: ["openai.com", "help.openai.com"],
  openai: ["openai.com", "platform.openai.com"],
  claude: ["anthropic.com", "support.anthropic.com"],
};

function hashQuery(query: string): string {
  let h = 0;
  for (let i = 0; i < query.length; i++) {
    h = (Math.imul(31, h) + query.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

function cacheKey(query: string, maxResults: number, depth: string): string {
  return `search:${hashQuery(query.toLowerCase().trim())}:${maxResults}:${depth}`;
}

async function fetchTavily(params: SearchParams): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY not configured.");
  }

  const maxResults = params.maxResults || 6;
  const depth = params.searchDepth || "basic";

  const response = await fetch(TAVILY_API_URL, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query: params.query,
      search_depth: depth,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: params.includeRawContent ?? true,
      include_images: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Tavily search error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      title: string;
      url: string;
      content: string;
      raw_content?: string;
      score: number;
    }>;
  };

  const results: SearchResult[] = (data.results || []).map((r) => ({
    title: r.title,
    url: normalizeUrl(r.url),
    content: r.content.slice(0, 800),
    score: r.score,
    rawContent: r.raw_content?.slice(0, 4000),
  }));

  return results;
}

const PROVIDER_TIMEOUT_MS = 12_000;

/** Backup provider: Exa neural search with page text. */
async function fetchExa(params: SearchParams): Promise<SearchResult[]> {
  const key = process.env.EXA_API_KEY;
  if (!key) throw new Error("EXA_API_KEY not configured.");
  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      query: params.query,
      numResults: params.maxResults || 6,
      type: "auto",
      contents: { text: { maxCharacters: 4000 } },
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Exa search error ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = (await response.json()) as {
    results?: Array<{ title?: string; url: string; text?: string; score?: number }>;
  };
  return (data.results || []).map((r, index) => ({
    title: r.title || r.url,
    url: normalizeUrl(r.url),
    content: (r.text || "").slice(0, 800),
    score: typeof r.score === "number" ? r.score : Math.max(0.1, 1 - index * 0.1),
    rawContent: params.includeRawContent === false ? undefined : (r.text || "").slice(0, 4000),
  }));
}

/** Backup provider: TinyFish search (snippets only; no page text). */
async function fetchTinyFish(params: SearchParams): Promise<SearchResult[]> {
  const key = process.env.TINYFISH_API_KEY;
  if (!key) throw new Error("TINYFISH_API_KEY not configured.");
  const url = new URL("https://api.search.tinyfish.ai");
  url.searchParams.set("query", params.query);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { "X-API-Key": key },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`TinyFish search error ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = (await response.json()) as {
    results?: Array<{ title?: string; url: string; snippet?: string; position?: number }>;
  };
  return (data.results || []).slice(0, params.maxResults || 6).map((r, index) => ({
    title: r.title || r.url,
    url: normalizeUrl(r.url),
    content: (r.snippet || "").slice(0, 800),
    score: Math.max(0.1, 1 - (r.position ? r.position - 1 : index) * 0.1),
  }));
}

/** Backup provider: Parallel Search (LLM-ready excerpts). Only used when PARALLEL_API_KEY is set. */
async function fetchParallel(params: SearchParams): Promise<SearchResult[]> {
  const key = process.env.PARALLEL_API_KEY;
  if (!key) throw new Error("PARALLEL_API_KEY not configured.");
  const response = await fetch("https://api.parallel.ai/v1/search", {
    method: "POST",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      objective: params.query,
      search_queries: [params.query],
      max_results: params.maxResults || 6,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Parallel search error ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = (await response.json()) as {
    results?: Array<{ title?: string; url: string; excerpts?: string[] }>;
  };
  return (data.results || []).slice(0, params.maxResults || 6).map((r, index) => {
    const text = (r.excerpts || []).join("\n\n");
    return {
      title: r.title || r.url,
      url: normalizeUrl(r.url),
      content: text.slice(0, 800),
      score: Math.max(0.1, 1 - index * 0.1),
      rawContent: params.includeRawContent === false ? undefined : text.slice(0, 4000),
    };
  });
}

const PROVIDERS: Array<{ name: string; run: (params: SearchParams) => Promise<SearchResult[]> }> = [
  { name: "tavily", run: fetchTavily },
  { name: "exa", run: fetchExa },
  { name: "parallel", run: fetchParallel },
  { name: "tinyfish", run: fetchTinyFish },
];

// After a provider fails, skip it briefly so an outage or exhausted quota does
// not add its timeout to every search in the fan-out.
const PROVIDER_COOLDOWN_MS = 60_000;
const providerCooldownUntil = new Map<string, number>();

/**
 * Searches Tavily first, then Exa, Parallel (if keyed) and TinyFish. A provider is only used when
 * the previous one errors, times out, or returns nothing. Results are cached
 * regardless of which provider answered.
 */
export async function searchTavily(params: SearchParams): Promise<SearchResult[]> {
  const maxResults = params.maxResults || 6;
  const depth = params.searchDepth || "basic";
  const cache = cacheKey(params.query, maxResults, depth);

  const cached = await redisGet<SearchResult[]>(cache);
  if (cached) {
    logger.debug("Search cache hit", { query: params.query });
    return cached;
  }

  const failures: string[] = [];
  for (const provider of PROVIDERS) {
    if ((providerCooldownUntil.get(provider.name) || 0) > Date.now()) continue;
    try {
      const results = (await provider.run(params)).filter((r) => /^https?:\/\//i.test(r.url));
      if (results.length === 0) {
        failures.push(`${provider.name}: no results`);
        continue;
      }
      await redisSet(cache, results, 3600);
      if (failures.length > 0) {
        logger.warn("Search served by fallback provider", { provider: provider.name, failures });
      }
      logger.info("Search completed", { provider: provider.name, query: params.query, results: results.length });
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${provider.name}: ${message}`);
      if (!/not configured/.test(message)) {
        providerCooldownUntil.set(provider.name, Date.now() + PROVIDER_COOLDOWN_MS);
      }
    }
  }

  throw new Error(`All search providers failed. ${failures.join(" | ").slice(0, 300)}`);
}

export async function searchEntitySources(
  entityName: string,
  context?: string,
  category: ComparisonCategory = "general_research",
): Promise<SearchResult[]> {
  const scopedContext = context?.trim();
  const quotedEntity = `"${entityName}"`;
  const definition = getComparisonCategoryDefinition(category);
  const queryAngles = definition.searchAngles.length > 0
    ? definition.searchAngles.slice(0, 4)
    : ["official information", "pricing details", "review comparison"];
  const queries = queryAngles.map((angle) =>
    `${quotedEntity} ${scopedContext || ""} ${angle}`.trim(),
  );

  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  await Promise.all(queries.map(async (q) => {
    try {
      const batch = await searchTavily({ query: q, maxResults: 3, searchDepth: "basic" });
      for (const r of batch) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
    } catch (e) {
      logger.warn("Search query failed", {
        query: q,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }));

  return allResults
    .sort((a, b) => sourcePriority(entityName, b, category) - sourcePriority(entityName, a, category))
    .slice(0, 8);
}

function sourcePriority(
  entityName: string,
  result: SearchResult,
  category: ComparisonCategory,
): number {
  const normalizedEntity = entityName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const hints = OFFICIAL_DOMAIN_HINTS[normalizedEntity] || [];
  const url = result.url.toLowerCase();
  const title = result.title.toLowerCase();
  let priority = result.score;

  if (hints.some((domain) => url.includes(domain))) priority += 5;
  if (title.includes(entityName.toLowerCase())) priority += 1;
  if (/\/(docs?|documentation|pricing|features|security|trust|compliance|status)\b/.test(url)) priority += 1.5;
  if (/\.(gov|edu)\b/.test(url)) priority += category === "place" || category === "finance_info" || category === "health_fitness" || category === "politics_policy" ? 3 : 1;
  if (/investor\.gov|sec\.gov|irs\.gov/.test(url)) priority += category === "finance_info" ? 4 : 0;
  if (/nih\.gov|cdc\.gov|who\.int|mayoclinic\.org|health\.harvard\.edu/.test(url)) {
    priority += category === "health_fitness" ? 4 : 0;
  }
  if (/congress\.gov|govtrack\.us|whitehouse\.gov|parliament\.|europarl\./.test(url)) {
    priority += category === "politics_policy" ? 4 : 0;
  }
  if (/stackoverflow\.com|github\.com|developer\.|docs\./.test(url)) {
    priority += category === "software" || category === "developer_tool" || category === "technical_standard" ? 2 : 0;
  }
  if (/reddit\.com|quora\.com/.test(url)) priority -= 0.75;

  if (normalizedEntity === "paddle" && /paddlepaddle|paddle\.readthedocs|drupal/.test(url)) {
    priority -= 5;
  }

  return priority;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove tracking params
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("ref");
    return u.toString();
  } catch {
    return url;
  }
}
