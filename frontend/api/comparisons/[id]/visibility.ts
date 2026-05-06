/**
 * POST /api/comparisons/:id/visibility
 * Toggle comparison visibility (publish/unpublish).
 */
import { sendJson } from "../../_lib/sideby.js";
import { requireAuth } from "../../_lib/auth.js";
import { publishComparison, unpublishComparison } from "../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
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

    const body = request.body as { action?: "publish" | "unpublish" };
    const action = body.action || "publish";

    if (action === "publish") {
      return sendJson(response, await publishComparison(id, auth.userId));
    } else {
      return sendJson(response, await unpublishComparison(id, auth.userId));
    }
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to update visibility." },
      status,
    );
  }
}
