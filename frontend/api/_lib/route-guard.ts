/**
 * API route wrapper with rate limiting.
 * Applies usage caps and burst protection to expensive routes.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "./auth.js";
import { checkRouteLimit, formatLimitError } from "./rate-limit.js";
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
    response.setHeader("Retry-After", String(Math.max(1, Math.ceil((limitResult.resetAt - Date.now()) / 1000))));
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

  // Admission already reserves usage. Failed attempts retain their reservation
  // because provider work may have started before the handler fails.
  return handler();
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
    response.setHeader("Retry-After", String(Math.max(1, Math.ceil((limitResult.resetAt - Date.now()) / 1000))));
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

  return handler();
}

export const AT_CAPACITY_MESSAGE = "SideBy is at capacity right now. Please try again later.";
export const AT_CAPACITY_CODE = "AT_CAPACITY";

export function sendAtCapacityResponse(
  response: VercelResponse,
  resetAt: number,
): unknown {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  response.setHeader("Retry-After", String(retryAfter));
  return sendJson(
    response,
    {
      error: AT_CAPACITY_MESSAGE,
      code: AT_CAPACITY_CODE,
    },
    503,
  );
}

