import {
  createComparisonJob,
  sendJson,
} from "../_lib/sideby.js";
import { authenticateRequest, isAuthEnabled } from "../_lib/auth.js";
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
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  const userId = isAuthEnabled()
    ? await authenticateRequest(request)
    : null;
  if (isAuthEnabled() && !userId) {
    return sendJson(response, { error: "Authentication required." }, 401);
  }

  try {
    const body = request.body as { query?: string };
    const query = body.query?.trim();

    if (!query) {
      return sendJson(response, { error: "Query is required." }, 400);
    }

    return sendJson(response, await createComparisonJob(query, userId, waitUntil));
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to create comparison." },
      500,
    );
  }
}
