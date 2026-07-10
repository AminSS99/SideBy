import { waitUntil } from "@vercel/functions";
import { and, eq, lte } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { sendJson } from "../_lib/sideby.js";
import { queueComparisonRefresh } from "../_lib/refresh-engine.js";
import { createDbClient } from "../../src/db/index.js";
import { watchlists } from "../../src/db/schema.js";
import { logger } from "../_lib/log.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

function nextRunFor(cadence: string) {
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + (cadence === "daily" ? 1 : cadence === "weekly" ? 7 : 30));
  return next;
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return sendJson(response, { error: "CRON_SECRET not configured." }, 503);
  }
  const header = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const token = header?.replace("Bearer ", "") || "";
  if (!timingSafeCompare(token, secret)) {
    return sendJson(response, { error: "Not found." }, 404);
  }

  try {
    const db = createDbClient();
    const due = await db
      .select()
      .from(watchlists)
      .where(and(eq(watchlists.status, "active"), lte(watchlists.nextRunAt, new Date())))
      .limit(5);

    for (const item of due) {
      if (!item.comparisonId) continue;
      waitUntil(
        queueComparisonRefresh(item.comparisonId, item.createdBy)
          .then(() =>
            db
              .update(watchlists)
              .set({
                lastRunAt: new Date(),
                nextRunAt: nextRunFor(item.cadence),
                updatedAt: new Date(),
              })
              .where(eq(watchlists.id, item.id)),
          )
          .catch((err) => {
            logger.error("Watchlist refresh failed", err instanceof Error ? err : undefined, {
              watchlistId: item.id,
            });
          })
          .then(() => undefined),
      );
    }

    return sendJson(response, { scanned: due.length });
  } catch (error) {
    logger.error("Watchlist scan failed", error instanceof Error ? error : undefined);
    return sendJson(response, { error: "Internal error." }, 500);
  }
}
