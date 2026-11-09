/**
 * GET /api/comparisons/by-slug/:slug
 * Public comparison lookup by slug.
 */
import { eq, and, desc } from "drizzle-orm";
import { createDbClient } from "../../../../src/db/index.js";
import { comparisons } from "../../../../src/db/schema.js";
import { sendJson, loadPublishEvidence } from "../../../_lib/sideby.js";
import {
  assessPublishEligibility,
  isRetrievableCitation,
} from "../../../_lib/public-eligibility.js";
import { authenticateRequest } from "../../../_lib/auth.js";
import { logger } from "../../../_lib/log.js";
import { analyzeComparisonQuery, summarizeComparisonTaxonomy } from "../../../../src/lib/comparisonTaxonomy.js";
import { projectPublicResult } from "../../../../src/lib/publicComparison.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
};

const LEGACY_SAMPLE_HASHES = new Set([
  "abc123",
  "def456",
  "neon123",
  "vercel123",
  "apple123",
  "numbeo123",
  "tesla123",
]);

/**
 * Trusted fixture classification: a stored record is a legacy sample only
 * when a source content-hash matches the known fixture set (server-side
 * data), never because the stored JSON claims a provenance.
 */
function isLegacySampleResult(rawResult: Record<string, unknown>): boolean {
  const sources = Array.isArray(rawResult.sources) ? rawResult.sources : [];
  return sources.some((source) => {
    if (!source || typeof source !== "object") return false;
    const hash = (source as { contentHash?: unknown }).contentHash;
    return typeof hash === "string" && LEGACY_SAMPLE_HASHES.has(hash);
  });
}

/**
 * Even fixtures stay public only while every claim they show carries a
 * retrievable citation; otherwise the whole record fails closed.
 */
function fixtureClaimsCited(rawResult: Record<string, unknown>): boolean {
  const categories = Array.isArray(rawResult.categories) ? rawResult.categories : [];
  let sawFact = false;
  for (const category of categories) {
    if (!category || typeof category !== "object") continue;
    const facts = (category as { facts?: unknown }).facts;
    if (!Array.isArray(facts)) continue;
    for (const fact of facts) {
      if (!fact || typeof fact !== "object") continue;
      sawFact = true;
      if (!isRetrievableCitation((fact as { sourceUrl?: unknown }).sourceUrl)) return false;
    }
  }
  return sawFact;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // CORS Headers for public embeddable widget
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    response.status(200).end();
    return;
  }

  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const slug = Array.isArray(request.query.slug)
      ? request.query.slug[0]
      : request.query.slug;
    if (!slug) {
      return sendJson(response, { error: "Comparison slug is required." }, 400);
    }

    const db = createDbClient();

    // Try public first
    const publicRows = await db
      .select()
      .from(comparisons)
      .where(
        and(
          eq(comparisons.slug, slug),
          eq(comparisons.status, "completed"),
          eq(comparisons.visibility, "public"),
        ),
      )
      .orderBy(desc(comparisons.updatedAt))
      .limit(1);

    if (publicRows[0]?.result) {
      const d = publicRows[0];
      const rawResult = d.result as Record<string, unknown>;
      // Public payload is an explicit allowlist projection, never the stored
      // record. An unprojectable record fails safe as not-found, never as a
      // partial public payload.
      const projected = projectPublicResult({ ...rawResult, slug: d.slug });
      if (!projected) {
        return sendJson(response, { error: "Comparison not found." }, 404);
      }

      // Privacy is re-established on every read from server-written evidence
      // (pipeline runs + normalized citations), so records that were
      // published before this gate — or whose claims can't be attributed —
      // stop being public instead of silently remaining so.
      let provenance: "researched" | "illustrative";
      if (isLegacySampleResult(rawResult)) {
        if (!fixtureClaimsCited(rawResult)) {
          return sendJson(response, { error: "Comparison not found." }, 404);
        }
        provenance = "illustrative";
      } else {
        const eligibility = assessPublishEligibility(
          rawResult,
          await loadPublishEvidence(db, d.id),
        );
        if (!eligibility.eligible) {
          return sendJson(response, { error: "Comparison not found." }, 404);
        }
        provenance = "researched";
      }

      const result = {
        ...projected,
        // Server-set classification; any stored claim is overridden.
        provenance,
        taxonomy:
          projected.taxonomy || summarizeComparisonTaxonomy(analyzeComparisonQuery(d.query)),
      };
      // Noncached authoritative reads: unpublishing stops new reads on the
      // very next request. Copies already downloaded or re-shared outside
      // SideBy can't be recalled, and the UI must say exactly that.
      response.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0, must-revalidate",
      );
      return sendJson(response, {
        id: d.id,
        status: "completed",
        progress: 100,
        activeStep: d.activeStep,
        query: d.query,
        result,
        error: null,
      });
    }

    // If not public, check auth
    const auth = await authenticateRequest(request);
    if (!auth.userId) {
      return sendJson(response, { error: "Comparison not found." }, 404);
    }

    const privateRows = await db
      .select()
      .from(comparisons)
      .where(
        and(
          eq(comparisons.slug, slug),
          eq(comparisons.clerkUserId, auth.userId),
        ),
      )
      .orderBy(desc(comparisons.updatedAt))
      .limit(1);

    if (!privateRows[0] || !privateRows[0].result) {
      return sendJson(response, { error: "Comparison not found." }, 404);
    }

    const d = privateRows[0];
    const result = {
      ...(d.result as Record<string, unknown>),
      slug: d.slug,
      taxonomy: (d.result as { taxonomy?: unknown }).taxonomy ||
        summarizeComparisonTaxonomy(analyzeComparisonQuery(d.query)),
    };
    return sendJson(response, {
      id: d.id,
      status: d.status === "running" || d.status === "queued" ? "running" : d.status,
      progress: d.progress,
      activeStep: d.activeStep,
      query: d.query,
      result,
      error: d.errorMessage,
    });
  } catch (error) {
    logger.error("by-slug error", error instanceof Error ? error : undefined);
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparison." },
      500,
    );
  }
}
