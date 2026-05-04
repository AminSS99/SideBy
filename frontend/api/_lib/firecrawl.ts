/**
 * Firecrawl Page Extraction Adapter with Redis caching.
 */
import { redisGet, redisSet } from "./redis";
import { logger } from "./log";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v2/scrape";

export interface ExtractedPage {
  url: string;
  title: string;
  markdown: string;
  metadata?: {
    sourceURL?: string;
    url?: string;
    title?: string;
  };
  contentHash: string;
}

function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

function cacheKey(url: string): string {
  return `firecrawl:${hashUrl(url)}`;
}

function contentHash(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (Math.imul(31, h) + content.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

export async function extractPage(url: string): Promise<ExtractedPage | null> {
  if (!FIRECRAWL_API_KEY) {
    logger.debug("Firecrawl not configured, skipping page extraction", { url });
    return null;
  }

  const cache = cacheKey(url);

  // Try cache first
  const cached = await redisGet<ExtractedPage>(cache);
  if (cached) {
    logger.debug("Firecrawl cache hit", { url });
    return cached;
  }

  const response = await fetch(FIRECRAWL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      removeBase64Images: true,
      timeout: 25000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.warn("Firecrawl extraction failed", { url, status: response.status, text: text.slice(0, 200) });
    return null;
  }

  const data = (await response.json()) as {
    data?: {
      markdown?: string;
      metadata?: { title?: string; sourceURL?: string; url?: string };
    };
  };

  const md = (data?.data?.markdown || "").slice(0, 12000);
  const title = data?.data?.metadata?.title || "";
  const canonical = data?.data?.metadata?.sourceURL || data?.data?.metadata?.url || url;

  const result: ExtractedPage = {
    url: canonical,
    title,
    markdown: md,
    metadata: data?.data?.metadata,
    contentHash: contentHash(md),
  };

  // Cache for 6 hours
  await redisSet(cache, result, 21600);

  logger.info("Firecrawl extraction completed", { url, title, length: md.length });

  return result;
}

export async function extractPages(urls: string[]): Promise<ExtractedPage[]> {
  const results: ExtractedPage[] = [];

  for (const url of urls) {
    const extracted = await extractPage(url);
    if (extracted) {
      results.push(extracted);
    }
  }

  return results;
}
