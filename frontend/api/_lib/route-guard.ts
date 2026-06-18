/**
 * API route wrapper with rate limiting.
 * Applies usage caps and burst protection to expensive routes.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "./auth.js";
import { checkRouteLimit, recordUsage, formatLimitError } from "./rate-limit.js";
import type { RateLimitAction } from "./rate-limit.js";
import { sendJson } from "./sideby.js";
import { assertRedisAvailable } from "./redis.js";

export function getClientIp(request: VercelRequest): string | null {
  // 1. Vercel's trusted forwarded IP
  const vercelForwarded = request.headers["x-vercel-forwarded-for"];
  if (typeof vercelForwarded === "string" && vercelForwarded.trim()) {
    return vercelForwarded.trim();
  }
  if (Array.isArray(vercelForwarded) && vercelForwarded[0]?.trim()) {
    return vercelForwarded[0].trim();
  }

  // 2. Standard real IP header
  const realIp = request.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }
  if (Array.isArray(realIp) && realIp[0]?.trim()) {
    return realIp[0].trim();
  }

  // 3. Fallback to x-forwarded-for
  // The client can spoof the leftmost IPs, so we take the rightmost (last) IP
  // which is appended by the proxy closest to our server.
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1]?.trim() || null;
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const lastItem = forwarded[forwarded.length - 1];
    if (typeof lastItem === "string" && lastItem.trim()) {
      const parts = lastItem.split(",");
      return parts[parts.length - 1]?.trim() || null;
    }
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

  // Record usage after successful handler
  const result = await handler();
  await recordUsage(auth.userId, ip, action);
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

  // Record usage after successful handler
  const result = await handler();
  await recordUsage(apiKey.userId, ip, action);
  return result;
}

