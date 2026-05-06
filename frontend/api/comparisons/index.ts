/**
 * GET /api/comparisons - list comparisons
 * POST /api/comparisons - create comparison
 */
import { createComparisonJob, listComparisonHistory, sendJson } from "../_lib/sideby.js";
import { requireAuth } from "../_lib/auth.js";
import { withRateLimit } from "../_lib/route-guard.js";
import { captureServerEvent } from "../_lib/analytics.js";
import { analyzeQueryIntent } from "../../src/lib/queryIntent.js";
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

      const intent = analyzeQueryIntent(query);
      if (!intent.canStart) {
        return sendJson(
          response,
          {
            error: intent.message,
            code: "QUERY_NOT_COMPARABLE",
            intent,
          },
          422,
        );
      }

      return await withRateLimit(request, response, "comparison", async () => {
        const auth = await requireAuth(request);

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
