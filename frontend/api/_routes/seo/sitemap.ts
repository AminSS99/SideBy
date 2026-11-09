import { eq, desc, and, sql } from "drizzle-orm";
import { createDbClient } from "../../../src/db/index.js";
import { comparisons } from "../../../src/db/schema.js";
import { logger } from "../../_lib/log.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
// input_scope is the server-written publication scope; see
// neon/migrations/020_comparison_publication_scope.sql and _lib/public-eligibility.ts.

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).end("Method Not Allowed");
  }

  try {
    const db = createDbClient();
    
    // Fetch public comparisons. The sitemap advertises the same records the
    // public read path can serve: publication is additionally gated by the
    // server-written publication scope ('public' = generated as a dedicated
    // public snapshot from entity-pair-only input). Legacy rows or reuse
    // derivatives must not be advertised as public pages, matching the
    // by-slug eligibility re-check that stops serving them.
    const rows = await db
      .select({
        slug: comparisons.slug,
        updatedAt: comparisons.updatedAt,
      })
      .from(comparisons)
      .where(
        and(
          eq(comparisons.visibility, "public"),
          sql`${comparisons.inputScope} = 'public'`,
        ),
      )
      .orderBy(desc(comparisons.updatedAt))
      .limit(2000);

    const baseUrl = (process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://sideby.ink")
      .replace(/\/+$/, "");
    const xmlBaseUrl = escapeXml(baseUrl);

    // Start XML generation
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Static Pages
    const staticPages = [
      { path: "", priority: "1.0", changefreq: "daily" },
      { path: "/pricing", priority: "0.8", changefreq: "weekly" },
      { path: "/features", priority: "0.8", changefreq: "weekly" },
      { path: "/about", priority: "0.7", changefreq: "monthly" },
      { path: "/contact", priority: "0.7", changefreq: "monthly" },
      { path: "/blog", priority: "0.6", changefreq: "weekly" },
      { path: "/docs", priority: "0.6", changefreq: "weekly" },
      { path: "/legal/privacy", priority: "0.4", changefreq: "yearly" },
      { path: "/legal/terms", priority: "0.4", changefreq: "yearly" },
      { path: "/legal/cookies", priority: "0.3", changefreq: "yearly" },
      { path: "/legal/refund", priority: "0.3", changefreq: "yearly" },
      { path: "/legal/security", priority: "0.5", changefreq: "monthly" },
    ];

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${xmlBaseUrl}${escapeXml(page.path)}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 2. Public Comparisons Dynamic Pages
    for (const row of rows) {
      if (!row.slug) continue;
      const lastmod = row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${xmlBaseUrl}/compare/${escapeXml(encodeURIComponent(row.slug))}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    response.setHeader("Content-Type", "application/xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return response.status(200).send(xml);
  } catch (error) {
    logger.error("Failed to generate sitemap", error instanceof Error ? error : undefined);
    return response.status(500).end("Internal Server Error");
  }
}
