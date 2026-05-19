import { waitUntil } from "@vercel/functions";
import { and, eq, lte } from "drizzle-orm";
import { sendJson } from "./_lib/sideby.js";
import { queueComparisonRefresh } from "./_lib/refresh-engine.js";
import { createDbClient } from "../src/db/index.js";
import { watchlists } from "../src/db/schema.js";
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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  const secret = process.env.CRON_SECRET;
  const header = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  if (secret && header !== `Bearer ${secret}`) return sendJson(response, { error: "Not found." }, 404);

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
        .then(() => undefined),
    );
  }

  return sendJson(response, { scanned: due.length });
}
