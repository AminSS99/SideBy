import { answerFollowUp, sendJson } from "../../_lib/sideby.js";
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
    const id = Array.isArray(request.query.id)
      ? request.query.id[0]
      : request.query.id;
    const body = request.body as { question?: string };
    const question = body.question?.trim();

    if (!id || !question) {
      return sendJson(
        response,
        { error: "Comparison id and question are required." },
        400,
      );
    }

    return sendJson(response, await answerFollowUp(id, question));
  } catch (error) {
    return sendJson(
      response,
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to answer follow-up.",
      },
      500,
    );
  }
}
