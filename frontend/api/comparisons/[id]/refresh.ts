import { refreshComparisonJob, sendJson } from "../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const id = Array.isArray(request.query.id)
      ? request.query.id[0]
      : request.query.id;
    if (!id) {
      return sendJson(response, { error: "Comparison id is required." }, 400);
    }

    return sendJson(response, await refreshComparisonJob(id));
  } catch (error) {
    return sendJson(
      response,
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to refresh comparison.",
      },
      500,
    );
  }
}
