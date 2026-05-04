import { getComparisonJob, sendJson } from "../_lib/sideby";
import { requireAuth } from "../_lib/auth";
import { createDbClient } from "../../src/db/index";
import { feedback } from "../../src/db/schema";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === "GET") {
    try {
      const auth = await requireAuth(request);
      const id = Array.isArray(request.query.id)
        ? request.query.id[0]
        : request.query.id;
      if (!id) {
        return sendJson(response, { error: "Comparison id is required." }, 400);
      }

      return sendJson(response, await getComparisonJob(id, auth.userId));
    } catch (error) {
      const status =
        error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 404;
      return sendJson(
        response,
        { error: error instanceof Error ? error.message : "Unable to load comparison." },
        status,
      );
    }
  }

  if (request.method === "POST") {
    // Feedback submission
    try {
      const auth = await requireAuth(request);
      const id = Array.isArray(request.query.id)
        ? request.query.id[0]
        : request.query.id;
      if (!id) {
        return sendJson(response, { error: "Comparison id is required." }, 400);
      }

      const body = request.body as {
        rating?: number;
        correction?: string;
        sourceReport?: string;
      };

      const db = createDbClient();
      await db.insert(feedback).values({
        comparisonId: id,
        clerkUserId: auth.userId,
        rating: body.rating ?? null,
        correction: body.correction ?? null,
        sourceReport: body.sourceReport ?? null,
      });

      return sendJson(response, { success: true });
    } catch (error) {
      return sendJson(
        response,
        { error: error instanceof Error ? error.message : "Unable to submit feedback." },
        500,
      );
    }
  }

  return sendJson(response, { error: "Method not allowed" }, 405);
}
