import { requireApiKey } from "../../_lib/api-key-auth.js";
import { getComparisonJob, sendJson } from "../../_lib/sideby.js";
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

  try {
    const apiKey = await requireApiKey(request);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) return sendJson(response, { error: "Comparison id is required." }, 400);
    return sendJson(response, await getComparisonJob(id, apiKey.userId));
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparison." },
      status,
    );
  }
}
