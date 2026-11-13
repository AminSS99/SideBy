/**
 * POST /api/comparisons/:id/public-snapshot
 * Generate a dedicated public snapshot of a completed comparison.
 *
 * The snapshot is generated from authorized public inputs only: the server
 * constructs the research query from the record's frozen entity names
 * ("A vs B"). The run is fresh — cache/reuse materialization must not leak
 * another record's content into a publishable record — and the row is
 * stamped `input_scope = 'public'` server-side. Records generated from
 * private briefs cannot be published directly; this is the path that does
 * not pretend otherwise.
 *
 * Rate-limit category "comparison": a snapshot triggers a real research run.
 */
import { sendJobError, sendJson, createPublicSnapshotComparison } from "../../../_lib/sideby.js";
import { requireAuth } from "../../../_lib/auth.js";
import { withRateLimit } from "../../../_lib/route-guard.js";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

const PublicSnapshotBodySchema = z.object({
  confirmed: z.literal(true, {
    errorMap: () => ({
      message: "Explicit approval of the exact option names is required before generating a public snapshot.",
    }),
  }),
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
    PublicSnapshotBodySchema.parse(request.body || {});
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) {
      return sendJson(response, { error: "Comparison id is required." }, 400);
    }

    return await withRateLimit(request, response, "comparison", async () => {
      // Keep serverless execution alive past response using Vercel waitUntil,
      // matching comparison creation.
      const snapshot = await createPublicSnapshotComparison(id, auth.userId, waitUntil);
      return sendJson(response, snapshot, 201);
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendJson(
        response,
        { error: error.errors[0]?.message || "Invalid public snapshot request." },
        400,
      );
    }
    return sendJobError(response, error, "Unable to generate a public snapshot.");
  }
}
