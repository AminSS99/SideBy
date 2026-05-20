import { and, desc, eq } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { canAccessWorkspace } from "../_lib/db-auth.js";
import { createComparisonJob, sendJson } from "../_lib/sideby.js";
import { assertNoLikelySecrets } from "../_lib/secret-scan.js";
import { createDbClient } from "../../src/db/index.js";
import { watchlists } from "../../src/db/schema.js";
import { withRateLimit } from "../_lib/route-guard.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
  api: {
    bodyParser: {
      sizeLimit: "512kb",
    },
  },
};

const WatchlistSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  comparisonId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  query: z.string().trim().min(1).max(800),
  cadence: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  alertThreshold: z.number().min(0.01).max(1).default(0.1),
  channels: z.record(z.unknown()).default({}),
});

function nextRunFor(cadence: "daily" | "weekly" | "monthly") {
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + (cadence === "daily" ? 1 : cadence === "weekly" ? 7 : 30));
  return next;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const db = createDbClient();
    const auth = await requireAuth(request);

    if (request.method === "GET") {
      const rows = await db
        .select()
        .from(watchlists)
        .where(eq(watchlists.createdBy, auth.userId))
        .orderBy(desc(watchlists.createdAt))
        .limit(100);
      return sendJson(response, { watchlists: rows });
    }

    if (request.method === "POST") {
      return await withRateLimit(request, response, "watchlist", async () => {
        const body = WatchlistSchema.parse(request.body || {});
        assertNoLikelySecrets(body.query);

        if (body.workspaceId) {
          const hasAccess = await canAccessWorkspace(db, auth.userId, body.workspaceId);
          if (!hasAccess) return sendJson(response, { error: "Workspace not found." }, 404);
        }

        let targetComparisonId = body.comparisonId;
        if (targetComparisonId) {
          const { canAccessComparison } = await import("../_lib/db-auth.js");
          const hasAccess = await canAccessComparison(db, auth.userId, targetComparisonId);
          if (!hasAccess) {
            return sendJson(response, { error: "Comparison not found or unauthorized." }, 404);
          }
        } else {
          // Each watchlist owns a dedicated comparison row
          const job = await createComparisonJob({
            query: body.query,
            userId: auth.userId,
            workspaceId: body.workspaceId || undefined,
          }, waitUntil);
          targetComparisonId = job.id;
        }

        const [row] = await db
          .insert(watchlists)
          .values({
            workspaceId: body.workspaceId || null,
            comparisonId: targetComparisonId,
            createdBy: auth.userId,
            name: body.name,
            query: body.query,
            cadence: body.cadence,
            alertThreshold: String(body.alertThreshold),
            channels: body.channels,
            nextRunAt: nextRunFor(body.cadence),
          })
          .returning();

        return sendJson(response, { watchlist: row }, 201);
      });
    }

    if (request.method === "PATCH") {
      return await withRateLimit(request, response, "watchlist", async () => {
        const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
        if (!id) return sendJson(response, { error: "Watchlist id is required." }, 400);

        const [row] = await db
          .update(watchlists)
          .set({ status: "paused", updatedAt: new Date() })
          .where(and(eq(watchlists.id, id), eq(watchlists.createdBy, auth.userId)))
          .returning();

        if (!row) return sendJson(response, { error: "Watchlist not found." }, 404);
        return sendJson(response, { watchlist: row });
      });
    }

    if (request.method === "DELETE") {
      const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
      if (!id) return sendJson(response, { error: "Watchlist id is required." }, 400);

      const [row] = await db
        .delete(watchlists)
        .where(and(eq(watchlists.id, id), eq(watchlists.createdBy, auth.userId)))
        .returning();

      if (!row) return sendJson(response, { error: "Watchlist not found." }, 404);
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
          : error instanceof Error ? error.message : "Unable to manage watchlists.",
      },
      status,
    );
  }
}
