/**
 * GET /api/comparisons/by-slug/:slug
 * Public comparison lookup by slug.
 */
import { eq, and, desc } from "drizzle-orm";
import { createDbClient } from "../../../src/db/index.js";
import { comparisons } from "../../../src/db/schema.js";
import { sendJson } from "../../_lib/sideby.js";
import { authenticateRequest } from "../../_lib/auth.js";
import { analyzeComparisonQuery, summarizeComparisonTaxonomy } from "../../../src/lib/comparisonTaxonomy.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
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
      const result = {
        ...(d.result as Record<string, unknown>),
        slug: d.slug,
        taxonomy: (d.result as { taxonomy?: unknown }).taxonomy ||
          summarizeComparisonTaxonomy(analyzeComparisonQuery(d.query)),
      };
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
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparison." },
      500,
    );
  }
}
