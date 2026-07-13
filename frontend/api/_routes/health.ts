/**
 * GET /api/health — basic health check
 * Returns only pass/fail status. Does NOT expose DB URLs, Redis hosts, or internal details.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { assertRedisAvailable, getRedis, getRuntimeStoreKind } from "../_lib/redis.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (request.query.sentry_test === "true") {
    throw new Error("Sentry verification test error: checking integration status");
  }

  let dbOk = false;
  let cacheOk = false;

  // Check database
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      await sql`select 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
  }

  // Check cache layer
  const redis = getRedis();
  if (redis) {
    try {
      await redis.get("health-check");
      cacheOk = true;
    } catch {
      cacheOk = false;
    }
  } else if (getRuntimeStoreKind() === "postgres") {
    try {
      await assertRedisAvailable();
      cacheOk = true;
    } catch {
      cacheOk = false;
    }
  } else {
    cacheOk = true; // no cache configured is not a failure
  }

  const healthy = dbOk && cacheOk;

  return response.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
  });
}
