import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { canAccessComparison } from "../_lib/db-auth.js";
import { sendJson } from "../_lib/sideby.js";
import { createDbClient } from "../../src/db/index.js";
import { sourceFeedback } from "../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

const FeedbackSchema = z.object({
  comparisonId: z.string().uuid().optional(),
  sourceUrl: z.string().url().max(2000),
  vote: z.number().int().min(-1).max(1),
  reason: z.string().trim().max(1000).optional(),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const body = FeedbackSchema.parse(request.body || {});
    const db = createDbClient();
    if (body.comparisonId) {
      const hasAccess = await canAccessComparison(db, auth.userId, body.comparisonId);
      if (!hasAccess) return sendJson(response, { error: "Comparison not found." }, 404);
    }
    const [row] = await db.insert(sourceFeedback).values({
      comparisonId: body.comparisonId || null,
      userId: auth.userId,
      sourceUrl: body.sourceUrl,
      vote: body.vote,
      reason: body.reason || null,
    }).returning();
    return sendJson(response, { feedback: row }, 201);
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
          : error instanceof Error ? error.message : "Unable to save source feedback.",
      },
      status,
    );
  }
}
