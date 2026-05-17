/**
 * GET /api/comparisons - list comparisons
 * POST /api/comparisons - create comparison
 */
import { createComparisonJob, listComparisonHistory, sendJson } from "../_lib/sideby.js";
import { requireAuth } from "../_lib/auth.js";
import { withRateLimit } from "../_lib/route-guard.js";
import { captureServerEvent } from "../_lib/analytics.js";
import {
  SUPPORTED_COMPARISON_CATEGORIES,
  analyzeComparisonQuery,
} from "../../src/lib/comparisonTaxonomy.js";
import { createDbClient } from "../../src/db/index.js";
import { queryAnalytics } from "../../src/db/schema.js";
import { normalizeQuery } from "../_lib/query-normalizer.js";
import { waitUntil } from "@vercel/functions";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === "GET") {
    try {
      const action = Array.isArray(request.query.action)
        ? request.query.action[0]
        : request.query.action;
      if (action === "taxonomy") {
        return sendJson(response, {
          categories: SUPPORTED_COMPARISON_CATEGORIES.map((category) => ({
            id: category.id,
            label: category.label,
            shortLabel: category.shortLabel,
            description: category.description,
            examples: category.examples,
            blockedExamples: category.blockedExamples,
            dimensions: category.defaultDimensions,
            sourceRequirements: category.sourceRequirements,
            disclaimer: category.disclaimer,
            safetyLevel: category.safetyLevel,
            freshnessClass: category.freshnessClass,
          })),
        });
      }

      const auth = await requireAuth(request);
      const limitParam = Array.isArray(request.query.limit)
        ? request.query.limit[0]
        : request.query.limit;
      const limit = Number(limitParam || 12);

      return sendJson(response, {
        comparisons: await listComparisonHistory(auth.userId, Number.isFinite(limit) ? limit : 12),
      });
    } catch (error) {
      const status =
        error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
      return sendJson(
        response,
        { error: error instanceof Error ? error.message : "Unable to load comparisons." },
        status,
      );
    }
  }

  if (request.method === "POST") {
    try {
      const body = request.body as { query?: string; workspaceId?: string; projectId?: string };
      const query = body.query?.trim();

      if (!query) {
        return sendJson(response, { error: "Query is required." }, 400);
      }

      const auth = await requireAuth(request);
      const intent = analyzeComparisonQuery(query);
      if (!intent.canStart) {
        const normalized = normalizeQuery(query);
        const db = createDbClient();
        await db.insert(queryAnalytics).values({
          rawQuery: query,
          normalizedQuery: normalized.normalizedQuery,
          canonicalSlug: normalized.canonicalSlug,
          detectedEntities: JSON.stringify([
            { name: intent.entityA, type: null },
            { name: intent.entityB, type: null },
          ].filter((entity) => entity.name)),
          queryCategory: intent.category,
          taxonomyStatus: intent.status,
          safetyLevel: intent.safetyLevel,
          taxonomyConfidence: String(intent.confidence),
          policyNote: intent.policyNote || intent.signals[0]?.label || null,
          policySignals: intent.signals,
          sourceStrategy: {
            requirements: intent.sourceRequirements,
            disclaimer: intent.disclaimer,
          },
          isVague: intent.status === "needs_entities" || intent.status === "needs_context",
          searchesUsed: 0,
          sourcesFound: 0,
          cacheHits: 0,
        });

        captureServerEvent(auth.userId, "comparison_rejected", {
          query,
          category: intent.category,
          status: intent.status,
          safety_level: intent.safetyLevel,
          policy_note: intent.policyNote,
        });

        return sendJson(
          response,
          {
            error: intent.message,
            code: intent.status === "sensitive" ? "QUERY_SENSITIVE" : "QUERY_NOT_COMPARABLE",
            intent,
          },
          422,
        );
      }

      return await withRateLimit(request, response, "comparison", async () => {
        const result = await createComparisonJob({
          query,
          userId: auth.userId,
          orgId: auth.orgId,
          workspaceId: body.workspaceId,
          projectId: body.projectId,
        }, waitUntil);

        captureServerEvent(auth.userId, "comparison_created", {
          query,
          workspace_id: body.workspaceId,
          project_id: body.projectId,
          org_id: auth.orgId,
        });

        return sendJson(response, result);
      });
    } catch (error) {
      const status =
        error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
      return sendJson(
        response,
        { error: error instanceof Error ? error.message : "Unable to create comparison." },
        status,
      );
    }
  }

  return sendJson(response, { error: "Method not allowed" }, 405);
}
