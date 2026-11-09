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

const TEN_MINUTES_IN_SECONDS = 10 * 60;

async function deleteClerkUser(userId: string) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw Object.assign(new Error("Clerk secret key is required."), { statusCode: 503 });
  }

  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw Object.assign(
      new Error(`Clerk user deletion failed: ${response.status} ${await response.text()}`),
      { statusCode: 502 },
    );
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const [user, accessibleWorkspaces, comparisonRows, promptRows, keyRows, settingsRow, watchlistRows] =
        await Promise.all([
          db.select().from(users).where(eq(users.id, auth.userId)).limit(1),
          getAccessibleWorkspaces(db, auth.userId),
          db.select().from(comparisons).where(eq(comparisons.clerkUserId, auth.userId)),
          db.select().from(promptTemplates).where(eq(promptTemplates.createdBy, auth.userId)),
          db
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
            .where(eq(apiKeys.userId, auth.userId)),
          db.select().from(userSettings).where(eq(userSettings.userId, auth.userId)).limit(1),
          db.select().from(watchlists).where(eq(watchlists.createdBy, auth.userId)),
        ]);

      return sendJson(response, {
        exportedAt: new Date().toISOString(),
        user: user[0] ?? null,
        workspaces: accessibleWorkspaces,
        comparisons: comparisonRows,
        promptTemplates: promptRows,
        apiKeys: keyRows,
        settings: settingsRow[0] ?? null,
        watchlists: watchlistRows,
      });
    }

    if (request.method === "DELETE") {
      DeleteSchema.parse(request.body || {});

      const now = Math.floor(Date.now() / 1000);
      if (!auth.iat || now - auth.iat > TEN_MINUTES_IN_SECONDS || auth.iat > now + 60) {
        return sendJson(
          response,
          { error: "Recent authentication required to delete account. Please sign in again." },
          403,
        );
      }

      await db.delete(workspaces).where(eq(workspaces.ownerId, auth.userId));
      await db.delete(users).where(eq(users.id, auth.userId));
      await deleteClerkUser(auth.userId);
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
