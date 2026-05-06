/**
 * API route wrapper with rate limiting.
 * Applies usage caps and burst protection to expensive routes.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "./auth.js";
import { checkRouteLimit, recordUsage, formatLimitError } from "./rate-limit.js";
import type { RateLimitAction } from "./rate-limit.js";
import { sendJson } from "./sideby.js";

export function getClientIp(request: VercelRequest): string | null {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || null;
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() || null;
  }
  return request.socket?.remoteAddress || null;
}

export async function withRateLimit(
  request: VercelRequest,
  response: VercelResponse,
  action: RateLimitAction,
  handler: () => Promise<unknown>,
): Promise<unknown> {
  const auth = await authenticateRequest(request);
  const ip = getClientIp(request);

  const limitResult = await checkRouteLimit(auth.userId, ip, action);

  if (!limitResult.allowed) {
    response.setHeader("X-RateLimit-Limit", String(limitResult.limit));
    response.setHeader("X-RateLimit-Remaining", "0");
    response.setHeader("X-RateLimit-Reset", String(Math.floor(limitResult.resetAt / 1000)));
    return sendJson(
      response,
      { error: formatLimitError(limitResult), code: "RATE_LIMITED" },
      429,
    );
  }

  // Set rate limit headers
  response.setHeader("X-RateLimit-Limit", String(limitResult.limit));
  response.setHeader("X-RateLimit-Remaining", String(limitResult.remaining));
  response.setHeader("X-RateLimit-Reset", String(Math.floor(limitResult.resetAt / 1000)));

  // Record usage after successful handler
  const result = await handler();
  await recordUsage(auth.userId, ip, action);
  return result;
}
