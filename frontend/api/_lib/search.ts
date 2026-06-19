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

export async function searchTavily(params: SearchParams): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY not configured.");
  }

  const maxResults = params.maxResults || 6;
  const depth = params.searchDepth || "basic";
  const cache = cacheKey(params.query, maxResults, depth);

  // Try cache first
  const cached = await redisGet<SearchResult[]>(cache);
  if (cached) {
    logger.debug("Tavily cache hit", { query: params.query });
    return cached;
  }

  console.log(`[Tavily Search] Starting fetch for query: "${params.query}"`);
  const response = await fetch(TAVILY_API_URL, {
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

  // Cache for 1 hour
  await redisSet(cache, results, 3600);

  logger.info("Tavily search completed", {
    query: params.query,
    results: results.length,
  });

  return results;
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

  console.log(`[Search Entity Sources] Running ${queries.length} queries for entity "${entityName}":`, queries);

  await Promise.all(queries.map(async (q) => {
    try {
      console.log(`[Search Entity Sources] Executing sub-query: "${q}"`);
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
