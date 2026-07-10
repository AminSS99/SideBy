/**
 * API route wrapper with rate limiting.
 * Applies usage caps and burst protection to expensive routes.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "./auth.js";
import { checkRouteLimit, checkAndRecordUsage, formatLimitError } from "./rate-limit.js";
import type { RateLimitAction } from "./rate-limit.js";
import { sendJson } from "./sideby.js";
import { assertRedisAvailable } from "./redis.js";

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
  await assertRedisAvailable();

  const auth = await authenticateRequest(request);
  const ip = getClientIp(request);

  const limitResult = await checkRouteLimit(auth.userId, ip, action, auth.orgId);

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

  const result = await handler();

  // Record usage atomically after successful handler
  if (auth.userId) {
    await checkAndRecordUsage("user", auth.userId, action);
  } else if (ip) {
    await checkAndRecordUsage("ip", ip, action);
  }
  return result;
}

export async function withApiKeyRateLimit(
  request: VercelRequest,
  response: VercelResponse,
  action: RateLimitAction,
  apiKey: { userId: string | null; orgId?: string | null },
  handler: () => Promise<unknown>,
): Promise<unknown> {
  await assertRedisAvailable();

  const ip = getClientIp(request);
  const limitResult = await checkRouteLimit(apiKey.userId, ip, action, apiKey.orgId);

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

  const result = await handler();

  // Record usage atomically after successful handler
  if (apiKey.userId) {
    await checkAndRecordUsage("user", apiKey.userId, action);
  } else if (ip) {
    await checkAndRecordUsage("ip", ip, action);
  }
  return result;
}

