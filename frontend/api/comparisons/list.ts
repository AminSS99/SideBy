import { listComparisonHistory, sendJson } from "../_lib/sideby.js";
import { authenticateRequest, isAuthEnabled } from "../_lib/auth.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  const userId = isAuthEnabled()
    ? await authenticateRequest(request)
    : null;
  if (isAuthEnabled() && !userId) {
    return sendJson(response, { error: "Authentication required." }, 401);
  }

  try {
    const limitParam = Array.isArray(request.query.limit)
      ? request.query.limit[0]
      : request.query.limit;
    const limit = Number(limitParam || 12);

    return sendJson(response, {
      comparisons: await listComparisonHistory(userId, Number.isFinite(limit) ? limit : 12),
    });
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparisons." },
      500,
    );
  }
}
