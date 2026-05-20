import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { getAccessibleWorkspaces } from "../_lib/db-auth.js";
import { sendJson } from "../_lib/sideby.js";
import { createDbClient } from "../../src/db/index.js";
import {
  apiKeys,
  comparisons,
  promptTemplates,
  userSettings,
  users,
  watchlists,
  workspaces,
} from "../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

const DeleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
      const accessibleWorkspaces = await getAccessibleWorkspaces(db, auth.userId);
      const comparisonRows = await db
        .select()
        .from(comparisons)
        .where(eq(comparisons.clerkUserId, auth.userId));
      const promptRows = await db
        .select()
        .from(promptTemplates)
        .where(eq(promptTemplates.createdBy, auth.userId));
      const keyRows = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          scopes: apiKeys.scopes,
          lastUsedAt: apiKeys.lastUsedAt,
          revokedAt: apiKeys.revokedAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, auth.userId));
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, auth.userId))
        .limit(1);
      const watchlistRows = await db
        .select()
        .from(watchlists)
        .where(eq(watchlists.createdBy, auth.userId));

      return sendJson(response, {
        exportedAt: new Date().toISOString(),
        user,
        workspaces: accessibleWorkspaces,
        comparisons: comparisonRows,
        promptTemplates: promptRows,
        apiKeys: keyRows,
        settings,
        watchlists: watchlistRows,
      });
    }

    if (request.method === "DELETE") {
      DeleteSchema.parse(request.body || {});
      await db.delete(workspaces).where(eq(workspaces.ownerId, auth.userId));
      await db.delete(users).where(eq(users.id, auth.userId));
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
          : error instanceof Error ? error.message : "Unable to manage account data.",
      },
      status,
    );
  }
}
