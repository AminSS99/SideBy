import { eq, desc } from "drizzle-orm";
import { createDbClient } from "../../../src/db/index.js";
import { comparisons } from "../../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

type SitemapEntry = {
  path: string;
  priority: string;
  changefreq: "daily" | "weekly" | "monthly";
  lastmod?: string;
};

const STATIC_LASTMOD = "2026-07-02T00:00:00.000Z";

const staticPages: SitemapEntry[] = [
  { path: "", priority: "1.0", changefreq: "daily", lastmod: STATIC_LASTMOD },
  { path: "/features", priority: "0.9", changefreq: "weekly", lastmod: STATIC_LASTMOD },
  { path: "/pricing", priority: "0.8", changefreq: "weekly", lastmod: STATIC_LASTMOD },
  { path: "/docs", priority: "0.8", changefreq: "weekly", lastmod: STATIC_LASTMOD },
  { path: "/blog", priority: "0.7", changefreq: "weekly", lastmod: STATIC_LASTMOD },
  { path: "/about", priority: "0.7", changefreq: "monthly", lastmod: STATIC_LASTMOD },
  { path: "/contact", priority: "0.7", changefreq: "monthly", lastmod: STATIC_LASTMOD },
  { path: "/legal/privacy", priority: "0.3", changefreq: "monthly", lastmod: STATIC_LASTMOD },
  { path: "/legal/terms", priority: "0.3", changefreq: "monthly", lastmod: STATIC_LASTMOD },
  { path: "/legal/cookies", priority: "0.3", changefreq: "monthly", lastmod: STATIC_LASTMOD },
  { path: "/legal/refund", priority: "0.3", changefreq: "monthly", lastmod: STATIC_LASTMOD },
  { path: "/legal/security", priority: "0.4", changefreq: "monthly", lastmod: STATIC_LASTMOD },
];

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toIsoDate = (value: Date | string | null | undefined) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const renderUrl = (baseUrl: string, entry: SitemapEntry) => {
  const loc = `${baseUrl}${entry.path}`;
  const lastmod = entry.lastmod ? `    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>\n` : "";

  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod.trimEnd(),
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
};

const renderSitemap = (baseUrl: string, entries: SitemapEntry[]) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => renderUrl(baseUrl, entry)),
    "</urlset>",
    "",
  ].join("\n");

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).end("Method Not Allowed");
  }

  const baseUrl = (process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://sideby.ink")
    .replace(/\/+$/, "");

  if (request.method === "HEAD") {
    response.setHeader("Content-Type", "application/xml");
    response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return response.status(200).end();
  }

  try {
    const db = createDbClient();
    
    // Fetch all public comparisons
    const rows = await db
      .select({
        slug: comparisons.slug,
        updatedAt: comparisons.updatedAt,
      })
      .from(comparisons)
      .where(eq(comparisons.visibility, "public"))
      .orderBy(desc(comparisons.updatedAt))
      .limit(50000 - staticPages.length);

    const comparisonPages = rows
      .filter((row) => row.slug)
      .map<SitemapEntry>((row) => ({
        path: `/compare/${encodeURIComponent(row.slug!)}`,
        lastmod: toIsoDate(row.updatedAt),
        changefreq: "weekly",
        priority: "0.6",
      }));

    const xml = renderSitemap(baseUrl, [...staticPages, ...comparisonPages]);

    response.setHeader("Content-Type", "application/xml");
    response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return response.status(200).send(xml);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    const fallbackXml = renderSitemap(baseUrl, staticPages);
    response.setHeader("Content-Type", "application/xml");
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response.status(200).send(fallbackXml);
  }
}
