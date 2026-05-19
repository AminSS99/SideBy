import { requireApiKey } from "../../../_lib/api-key-auth.js";
import { exportComparison } from "../../../_lib/export-engine.js";
import { sendJson } from "../../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { withApiKeyRateLimit } from "../../../_lib/route-guard.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
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
    if (!apiKey.userId) return sendJson(response, { error: "API key is not linked to a user." }, 403);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    const formatValue = Array.isArray(request.query.format) ? request.query.format[0] : request.query.format;
    const format = formatValue === "json" ? "json" : "markdown";
    if (!id) return sendJson(response, { error: "Comparison id is required." }, 400);

    return withApiKeyRateLimit(request, response, "export", apiKey, async () => {
      const result = await exportComparison(id, apiKey.userId, format);
      return sendJson(response, result);
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to export comparison." },
      status,
    );
  }
}
