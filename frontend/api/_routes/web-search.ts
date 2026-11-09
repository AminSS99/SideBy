/**
 * POST /api/web-search — live web search for signed-in users.
 * Free plan: FREE_WEB_SEARCHES_PER_DAY (default 2) per account per UTC day.
 * Anonymous requests are rejected so every search is attributable to an account.
 */
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { assertRedisAvailable } from "../_lib/redis.js";
import { checkRouteLimit, formatLimitError, refundUsage } from "../_lib/rate-limit.js";
import { searchTavily } from "../_lib/search.js";
import { logger } from "../_lib/log.js";
import { sendJson } from "../_lib/sideby.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

const BodySchema = z.object({
  query: z.string().trim().min(3, "Enter at least 3 characters.").max(300, "Keep the search under 300 characters."),
});

const isHttpUrl = (value: string) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const { query } = BodySchema.parse(request.body || {});
    await assertRedisAvailable();

    // Reserves a daily slot before any provider is called, so parallel
    // requests cannot overspend the cap.
    const limit = await checkRouteLimit(auth.userId, null, "webSearch", auth.orgId);
    if (!limit.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))));
      response.setHeader("X-RateLimit-Remaining", "0");
      return sendJson(response, { error: formatLimitError(limit), code: "RATE_LIMITED", limit: limit.limit, remaining: 0 }, 429);
    }

    const unlimited = limit.limit >= Number.MAX_SAFE_INTEGER;
    const remaining = unlimited ? null : limit.remaining;
    response.setHeader("Cache-Control", "private, no-store");
    if (remaining !== null) response.setHeader("X-RateLimit-Remaining", String(remaining));

    try {
      const results = await searchTavily({ query, maxResults: 8, includeRawContent: false });
      return sendJson(response, {
        query,
        results: results
          .filter((result) => isHttpUrl(result.url))
          .map((result) => ({
            title: result.title.slice(0, 200),
            url: result.url,
            snippet: result.content.slice(0, 400),
          })),
        usage: { limit: unlimited ? null : limit.limit, remaining },
      });
    } catch (error) {
      logger.error("Web search failed", error instanceof Error ? error : undefined);
      // Our provider failed before returning anything: don't charge the user's daily slot.
      await refundUsage("user", auth.userId, "webSearch");
      return sendJson(response, { error: "Search is temporarily unavailable. Please try again shortly." }, 503);
    }
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
    return sendJson(
      response,
      {
        error: error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid search."
          : error instanceof Error ? error.message : "Unable to search.",
      },
      status,
    );
  }
}
