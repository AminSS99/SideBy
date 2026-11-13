import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { validateComparisonQuery } from "../../_lib/comparison-validator.js";
import { configuredQuota } from "../../_lib/plan-limits.js";
import { logger } from "../../_lib/log.js";
import { checkRateLimit } from "../../_lib/rate-limit.js";
import { getClientIp } from "../../_lib/route-guard.js";

const BodySchema = z.object({
  query: z.string().trim().min(1).max(800),
});

const sendJson = (response: VercelResponse, payload: unknown, status = 200) => {
  response.setHeader("Cache-Control", "private, max-age=60");
  return response.status(status).json(payload);
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const ip = getClientIp(request);
    if (!ip) return sendJson(response, { error: "Unable to validate request." }, 400);

    const limit = await checkRateLimit("ip", ip, "comparison-validation", 12);
    if (!limit.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))));
      return sendJson(response, { error: "Too many validation requests. Please wait a moment." }, 429);
    }

    const { query } = BodySchema.parse(request.body || {});
    // Global spend breaker: unauthenticated validation fans out to Tavily +
    // the LLM, so cap total AI-backed validations per minute across all IPs.
    const globalCap = configuredQuota("VALIDATION_AI_GLOBAL_PER_MIN", 60);
    const global = await checkRateLimit("ip", "global", "comparison-validation-ai", globalCap);
    const validation = await validateComparisonQuery(query, { allowAi: global.allowed });
    return sendJson(response, validation);
  } catch (error) {
    const unavailable = error instanceof Error && "statusCode" in error && error.statusCode === 503;
    const status = error instanceof z.ZodError ? 400 : unavailable ? 503 : 500;
    if (!(error instanceof z.ZodError)) {
      logger.warn("Comparison eligibility check failed", { error: error instanceof Error ? error.message : String(error) });
    }
    if (unavailable) response.setHeader("Retry-After", "60");
    return sendJson(response, {
      error: error instanceof z.ZodError
        ? error.errors[0]?.message || "Invalid request."
        : "Comparison checks are temporarily unavailable. Please try again shortly.",
    }, status);
  }
}
