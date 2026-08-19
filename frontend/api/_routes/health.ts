/**
 * GET /api/health — shallow process health check
 *
 * This endpoint intentionally performs no network or database I/O. It is safe to
 * poll frequently without preventing Neon from scaling to zero.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

  return response.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
