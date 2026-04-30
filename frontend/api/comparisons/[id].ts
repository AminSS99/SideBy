import { getComparisonJob, sendJson } from "../_lib/sideby.js";
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
    const id = Array.isArray(request.query.id)
      ? request.query.id[0]
      : request.query.id;
    if (!id) {
      return sendJson(response, { error: "Comparison id is required." }, 400);
    }

    return sendJson(response, await getComparisonJob(id, userId));
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparison." },
      404,
    );
  }
}
