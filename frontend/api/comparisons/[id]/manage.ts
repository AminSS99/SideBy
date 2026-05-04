/**
 * POST /api/comparisons/:id/manage
 * Refresh or retry a comparison.
 */
import { sendJson } from "../../_lib/sideby";
import { requireAuth } from "../../_lib/auth";
import { withRateLimit } from "../../_lib/route-guard";
import { refreshComparison } from "../../_lib/refresh-engine";
import { createDbClient } from "../../../src/db/index";
import { comparisons } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { runComparisonJob } from "../../_lib/job-engine";
import { captureServerEvent } from "../../_lib/analytics";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id)
      ? request.query.id[0]
      : request.query.id;
    if (!id) {
      return sendJson(response, { error: "Comparison id is required." }, 400);
    }

    const body = request.body as { action?: "refresh" | "retry" };
    const action = body.action || "refresh";

    if (action === "retry") {
      // Retry failed comparison
      const db = createDbClient();
      const rows = await db
        .select({ clerkUserId: comparisons.clerkUserId, query: comparisons.query, status: comparisons.status })
        .from(comparisons)
        .where(eq(comparisons.id, id))
        .limit(1);

      if (rows.length === 0) {
        return sendJson(response, { error: "Comparison not found." }, 404);
      }

      const comp = rows[0];
      if (comp.clerkUserId !== auth.userId) {
        return sendJson(response, { error: "Comparison not found." }, 404);
      }

      if (comp.status !== "failed") {
        return sendJson(response, { error: "Only failed comparisons can be retried." }, 400);
      }

      await db
        .update(comparisons)
        .set({
          status: "queued",
          progress: 0,
          activeStep: 0,
          retryCount: 0,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, id));

      runComparisonJob(id, auth.userId, comp.query, auth.orgId).catch(() => {});

      captureServerEvent(auth.userId, "comparison_retried", { comparison_id: id });
      return sendJson(response, { success: true, message: "Comparison research restarted." });
    }

    // Refresh comparison (with rate limit)
    return await withRateLimit(request, response, "refresh", async () => {
      const result = await refreshComparison(id, auth.userId);
      captureServerEvent(auth.userId, "comparison_refreshed", { comparison_id: id });
      return sendJson(response, result);
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to manage comparison." },
      status,
    );
  }
}
