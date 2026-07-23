import "dotenv/config";

import { execFileSync } from "node:child_process";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { and, desc, eq } from "drizzle-orm";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(projectRoot, "public", "sitemap.xml");
const baseUrl = (
  process.env.SITE_URL ||
  process.env.VITE_APP_URL ||
  "https://sideby.ink"
).replace(/\/+$/, "");

type StaticPage = {
  path: string;
  source: string;
};

const staticPages: StaticPage[] = [
  { path: "/", source: "src/pages/Index.tsx" },
  { path: "/features", source: "src/pages/Features.tsx" },
  { path: "/pricing", source: "src/pages/Pricing.tsx" },
  { path: "/docs", source: "src/pages/Docs.tsx" },
  { path: "/about", source: "src/pages/About.tsx" },
  { path: "/blog", source: "src/pages/Blog.tsx" },
  { path: "/contact", source: "src/pages/Contact.tsx" },
  { path: "/legal/privacy", source: "src/pages/legal/PrivacyPolicy.tsx" },
  { path: "/legal/terms", source: "src/pages/legal/TermsOfService.tsx" },
  { path: "/legal/cookies", source: "src/pages/legal/CookiesPolicy.tsx" },
  { path: "/legal/refund", source: "src/pages/legal/RefundPolicy.tsx" },
  { path: "/legal/security", source: "src/pages/legal/SecurityOverview.tsx" },
];

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const lastModified = async (relativePath: string) => {
  try {
    if (process.env.SITEMAP_IGNORE_WORKTREE !== "1") {
      const isDirty = execFileSync(
        "git",
        ["status", "--porcelain", "--", relativePath],
        { cwd: projectRoot, encoding: "utf8" },
      ).trim();
      if (isDirty) {
        return (await stat(path.join(projectRoot, relativePath))).mtime.toISOString();
      }
    }

    const value = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relativePath],
      { cwd: projectRoot, encoding: "utf8" },
    ).trim();
    if (value) return new Date(value).toISOString();
  } catch {
    // Git metadata may be unavailable in an exported deployment source.
  }

  return (await stat(path.join(projectRoot, relativePath))).mtime.toISOString();
};

const comparisonUrls = async () => {
  const hasDatabaseUrl = Boolean(
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL,
  );

  if (!hasDatabaseUrl) {
    console.warn("No database URL found; generating the static-page sitemap only.");
    return [] as { loc: string; lastmod: string }[];
  }

  try {
    const db = createDbClient();
    const rows = await db
      .select({
        slug: comparisons.slug,
        updatedAt: comparisons.updatedAt,
      })
      .from(comparisons)
      .where(
        and(
          eq(comparisons.visibility, "public"),
          eq(comparisons.status, "completed"),
        ),
      )
      .orderBy(desc(comparisons.updatedAt))
      .limit(49_000);

    return rows.map((row) => ({
      loc: `${baseUrl}/compare/${encodeURIComponent(row.slug)}`,
      lastmod: new Date(row.updatedAt).toISOString(),
    }));
  } catch (error) {
    if (process.env.VERCEL === "1" || process.env.CI === "true") {
      throw error;
    }
    console.warn(
      `Could not load public comparisons; generated static URLs only: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [] as { loc: string; lastmod: string }[];
  }
};

const staticUrls = await Promise.all(
  staticPages.map(async (page) => ({
    loc: `${baseUrl}${page.path === "/" ? "/" : page.path}`,
    lastmod: await lastModified(page.source),
  })),
);

const urls = [...staticUrls, ...(await comparisonUrls())];
const body = urls
  .map(
    ({ loc, lastmod }) =>
      [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "  </url>",
      ].join("\n"),
  )
  .join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  body,
  "</urlset>",
  "",
].join("\n");

await writeFile(outputPath, xml, "utf8");
console.log(`Generated ${outputPath} with ${urls.length} URLs.`);
