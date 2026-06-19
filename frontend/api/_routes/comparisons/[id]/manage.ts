/**
 * POST /api/comparisons/:id/manage
 * Refresh or retry a comparison.
 */
import { sendJson } from "../../../_lib/sideby.js";
import { requireAuth } from "../../../_lib/auth.js";
import { withRateLimit } from "../../../_lib/route-guard.js";
import { queueComparisonRefresh } from "../../../_lib/refresh-engine.js";
import { createDbClient } from "../../../../src/db/index.js";
import {
  aiRuns,
  comparisonDimensions,
  comparisonEntities,
  comparisonFacts,
  comparisonScores,
  comparisonSources,
  comparisonVerdicts,
  comparisons,
} from "../../../../src/db/schema.js";
import { eq } from "drizzle-orm";
import { runComparisonJob } from "../../../_lib/job-engine.js";
import { captureServerEvent } from "../../../_lib/analytics.js";
import { canMutateComparison } from "../../../_lib/db-auth.js";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

const ManageBodySchema = z.object({
  action: z.enum(["refresh", "retry"]).default("refresh"),
});

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

    const body = ManageBodySchema.parse(request.body || {});
    const action = body.action;

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
      const canMutate = await canMutateComparison(db, auth.userId, id);
      if (!canMutate) {
        return sendJson(response, { error: "Comparison not found." }, 404);
      }

      if (comp.status !== "failed") {
        return sendJson(response, { error: "Only failed comparisons can be retried." }, 400);
      }

      await db.delete(comparisonFacts).where(eq(comparisonFacts.comparisonId, id));
      await db.delete(comparisonScores).where(eq(comparisonScores.comparisonId, id));
      await db.delete(comparisonVerdicts).where(eq(comparisonVerdicts.comparisonId, id));
      await db.delete(comparisonSources).where(eq(comparisonSources.comparisonId, id));
      await db.delete(comparisonDimensions).where(eq(comparisonDimensions.comparisonId, id));
      await db.delete(comparisonEntities).where(eq(comparisonEntities.comparisonId, id));
      await db.delete(aiRuns).where(eq(aiRuns.comparisonId, id));

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

      if (process.env.DISABLE_IN_PROCESS_JOBS === "true") {
        console.log(`[DISABLE_IN_PROCESS_JOBS] Comparison retry job ${id} queued for external worker.`);
      } else {
        waitUntil(runComparisonJob(id, auth.userId, comp.query, auth.orgId).catch(() => {}));
      }

      captureServerEvent(auth.userId, "comparison_retried", { comparison_id: id });
      return sendJson(response, { success: true, message: "Comparison research restarted." });
    }

    // Refresh comparison (with rate limit)
    return await withRateLimit(request, response, "refresh", async () => {
      const result = await queueComparisonRefresh(id, auth.userId);
      captureServerEvent(auth.userId, "comparison_refreshed", { comparison_id: id });
      return sendJson(response, result, 202);
    });
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      {
        error: error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid request body."
          : error instanceof Error ? error.message : "Unable to manage comparison.",
      },
      status,
    );
  }
}
