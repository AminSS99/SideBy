/**
 * POST /api/comparisons/:id/visibility
 * Toggle comparison visibility (publish/unpublish).
 */
import { sendJson } from "../../../_lib/sideby.js";
import { requireAuth } from "../../../_lib/auth.js";
import { publishComparison, unpublishComparison } from "../../../_lib/sideby.js";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

const VisibilityBodySchema = z.object({
  action: z.enum(["publish", "unpublish"]).default("publish"),
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

    const body = VisibilityBodySchema.parse(request.body || {});

    if (body.action === "publish") {
      return sendJson(response, await publishComparison(id, auth.userId));
    } else {
      return sendJson(response, await unpublishComparison(id, auth.userId));
    }
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof z.ZodError
        ? error.errors[0]?.message || "Invalid request body."
        : error instanceof Error ? error.message : "Unable to update visibility."
      },
      status,
    );
  }
}
