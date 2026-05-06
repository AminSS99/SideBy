/**
 * GET /api/health — basic health check
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { getRedis } from "./_lib/redis.js";

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

  const checks: Record<string, "ok" | "error" | "not_configured"> = {
    server: "ok",
  };

  // Check database
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      await sql`select 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
  } else {
    checks.database = "not_configured";
  }

  // Check Redis
  const redis = getRedis();
  if (redis) {
    try {
      await redis.get("health-check");
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }
  } else {
    checks.redis = "not_configured";
  }

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "not_configured");

  return response.status(allOk ? 200 : 503).json({
    status: allOk ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
}
