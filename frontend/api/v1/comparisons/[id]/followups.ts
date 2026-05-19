import { z } from "zod";
import { requireApiKey } from "../../../_lib/api-key-auth.js";
import { answerFollowUp } from "../../../_lib/followup-engine.js";
import { sendJson } from "../../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { withApiKeyRateLimit } from "../../../_lib/route-guard.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "512kb",
    },
  },
};

const BodySchema = z.object({
  question: z.string().trim().min(1).max(1200),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const apiKey = await requireApiKey(request);
    if (!apiKey.userId) return sendJson(response, { error: "API key is not linked to a user." }, 403);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) return sendJson(response, { error: "Comparison id is required." }, 400);

    return withApiKeyRateLimit(request, response, "followUp", apiKey, async () => {
      const body = BodySchema.parse(request.body || {});
      return sendJson(response, await answerFollowUp(id, apiKey.userId, body.question));
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
          : error instanceof Error ? error.message : "Unable to answer follow-up.",
      },
      status,
    );
  }
}
