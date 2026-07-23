import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath: string) =>
  readFile(path.join(projectRoot, relativePath), "utf8");

const sitemap = await read("public/sitemap.xml");
const indexHtml = await read("index.html");
const manifest = JSON.parse(await read("public/manifest.json")) as {
  icons?: Array<{ src?: string; sizes?: string; type?: string }>;
};
const vercel = JSON.parse(await read("vercel.json")) as {
  headers?: Array<{
    source?: string;
    headers?: Array<{ key?: string; value?: string }>;
  }>;
};

const fail = (message: string): never => {
  throw new Error(`SEO validation failed: ${message}`);
};

if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  fail("sitemap.xml is missing its UTF-8 XML declaration");
}
if (!sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  fail("sitemap.xml uses the wrong sitemap namespace");
}

const urls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
if (urls.length === 0 || urls.length > 50_000) {
  fail(`sitemap.xml contains an invalid URL count (${urls.length})`);
}

const seen = new Set<string>();
for (const entry of urls) {
  const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
  const lastmod = entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
  if (!loc || !loc.startsWith("https://")) fail(`invalid <loc>: ${loc ?? "missing"}`);
  if (seen.has(loc)) fail(`duplicate URL: ${loc}`);
  seen.add(loc);
  if (!lastmod || Number.isNaN(Date.parse(lastmod))) {
    fail(`invalid <lastmod> for ${loc}`);
  }
}

if (!indexHtml.includes('rel="icon" href="/favicon.ico"')) {
  fail("index.html does not reference /favicon.ico as the primary icon");
}
if (!manifest.icons?.some((icon) => icon.src === "/icon-192.png")) {
  fail("manifest.json is missing the 192px icon");
}
if (!manifest.icons?.some((icon) => icon.src === "/icon-512.png")) {
  fail("manifest.json is missing the 512px icon");
}

const favicon = await stat(path.join(projectRoot, "public", "favicon.ico"));
if (favicon.size < 100) fail("favicon.ico is empty or invalid");

const faviconHeaders = vercel.headers?.find(
  (rule) => rule.source === "/favicon.ico",
)?.headers;
const faviconMime = faviconHeaders?.find(
  (header) => header.key?.toLowerCase() === "content-type",
)?.value;
if (faviconMime !== "image/x-icon") {
  fail(`favicon.ico MIME type is ${faviconMime ?? "not configured"}`);
}

const sitemapHeaders = vercel.headers?.find(
  (rule) => rule.source === "/sitemap.xml",
)?.headers;
const sitemapMime = sitemapHeaders?.find(
  (header) => header.key?.toLowerCase() === "content-type",
)?.value;
if (!sitemapMime?.startsWith("application/xml")) {
  fail(`sitemap.xml MIME type is ${sitemapMime ?? "not configured"}`);
}

console.log(
  `SEO validation passed: ${urls.length} sitemap URLs, favicon and manifest assets, and MIME headers.`,
);
