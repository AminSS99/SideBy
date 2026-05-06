/**
 * Tavily Search Adapter with Redis caching and source deduplication.
 */
import { redisGet, redisSet } from "./redis.js";
import { logger } from "./log.js";

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
): Promise<SearchResult[]> {
  const queries = [
    `${entityName} ${context || ""} pricing plans official`.trim(),
    `${entityName} ${context || ""} features documentation`.trim(),
    `${entityName} ${context || ""} review comparison`.trim(),
  ];

  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const q of queries) {
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
  }

  return allResults.slice(0, 8);
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
