import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "./_lib/auth.js";
import { canAccessComparison } from "./_lib/db-auth.js";
import { sendJson } from "./_lib/sideby.js";
import { createDbClient } from "../src/db/index.js";
import { decisionMatrices } from "../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "512kb",
    },
  },
};

const MatrixSchema = z.object({
  comparisonId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  weights: z.record(z.number()).default({}),
  result: z.record(z.unknown()).default({}),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const comparisonId = Array.isArray(request.query.comparisonId)
        ? request.query.comparisonId[0]
        : request.query.comparisonId;
      const rows = await db
        .select()
        .from(decisionMatrices)
        .where(
          comparisonId
            ? and(eq(decisionMatrices.userId, auth.userId), eq(decisionMatrices.comparisonId, comparisonId))
            : eq(decisionMatrices.userId, auth.userId),
        )
        .orderBy(desc(decisionMatrices.updatedAt))
        .limit(50);
      return sendJson(response, { matrices: rows });
    }

    if (request.method === "POST") {
      const body = MatrixSchema.parse(request.body || {});
      if (body.comparisonId) {
        const hasAccess = await canAccessComparison(db, auth.userId, body.comparisonId);
        if (!hasAccess) return sendJson(response, { error: "Comparison not found." }, 404);
      }
      const [row] = await db
        .insert(decisionMatrices)
        .values({
          comparisonId: body.comparisonId || null,
          userId: auth.userId,
          name: body.name,
          weights: body.weights,
          result: body.result,
        })
        .returning();
      return sendJson(response, { matrix: row }, 201);
    }

    if (request.method === "DELETE") {
      const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
      if (!id) return sendJson(response, { error: "Matrix id is required." }, 400);
      const [row] = await db
        .delete(decisionMatrices)
        .where(and(eq(decisionMatrices.id, id), eq(decisionMatrices.userId, auth.userId)))
        .returning();
      if (!row) return sendJson(response, { error: "Matrix not found." }, 404);
      return sendJson(response, { success: true });
    }

    return sendJson(response, { error: "Method not allowed" }, 405);
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
          : error instanceof Error ? error.message : "Unable to manage decision matrices.",
      },
      status,
    );
  }
}
