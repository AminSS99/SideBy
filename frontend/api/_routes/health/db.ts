/**
 * GET /api/health/db — authenticated deep database health check
 *
 * Poll this endpoint sparingly (every 15–30 minutes). Each successful request
 * queries Neon and therefore wakes a suspended compute.
 */
import { timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
};

function tokensMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  return candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const healthcheckSecret = process.env.HEALTHCHECK_SECRET;
  if (!healthcheckSecret) {
    return response.status(503).json({ error: "Deep health check is not configured" });
  }

  const authorization = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!tokensMatch(token, healthcheckSecret)) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    return response.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const sql = neon(databaseUrl);
    await sql`select 1`;

    return response.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return response.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
    });
  }
}
