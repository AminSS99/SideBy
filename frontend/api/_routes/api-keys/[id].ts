import { and, eq, isNull, or } from "drizzle-orm";
import { requireAuth } from "../../_lib/auth.js";
import { sendJson } from "../../_lib/sideby.js";
import { createDbClient } from "../../../src/db/index.js";
import { apiKeys } from "../../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "DELETE") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) {
      return sendJson(response, { error: "API key id is required." }, 400);
    }

    const db = createDbClient();
    const [row] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(apiKeys.id, id),
          isNull(apiKeys.revokedAt),
          or(
            eq(apiKeys.userId, auth.userId),
            auth.orgId ? eq(apiKeys.organizationId, auth.orgId) : eq(apiKeys.userId, auth.userId),
          ),
        ),
      )
      .returning();

    if (!row) {
      return sendJson(response, { error: "API key not found." }, 404);
    }

    return sendJson(response, { success: true });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to revoke API key." },
      status,
    );
  }
}
