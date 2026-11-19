/**
 * POST /api/comparisons/:id/translate
 * Returns the stored result with its prose translated to Azerbaijani or Russian.
 * Cached per (comparison, language, content), capped per user per day.
 */
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson, getComparisonJob } from "../../../_lib/sideby.js";
import { requireAuth } from "../../../_lib/auth.js";
import { assertRedisAvailable, redisGet, redisIncrement, redisSet } from "../../../_lib/redis.js";
import { checkGlobalDailyBudget, checkRateLimit } from "../../../_lib/rate-limit.js";
import { configuredQuota } from "../../../_lib/plan-limits.js";
import { sendAtCapacityResponse } from "../../../_lib/route-guard.js";
import { logger } from "../../../_lib/log.js";
import {
  TRANSLATION_LANGUAGES,
  applyTranslations,
  collectTranslatableSlots,
  translateStrings,
  translationCacheKey,
} from "../../../_lib/result-translation.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "64kb",
    },
  },
};

const BodySchema = z.object({ language: z.enum(TRANSLATION_LANGUAGES) });

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const dailyLimit = () => {
  const parsed = Number(process.env.TRANSLATE_DAILY_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 20;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) return sendJson(response, { error: "Comparison id is required." }, 400);
    const { language } = BodySchema.parse(request.body || {});

    const job = await getComparisonJob(id, auth.userId);
    if (job.status !== "completed" || !job.result) {
      return sendJson(response, { error: "The comparison is not finished yet." }, 409);
    }

    const slots = collectTranslatableSlots(job.result);
    if (slots.length === 0) return sendJson(response, { language, cached: true, result: job.result });

    const cacheKey = translationCacheKey(id, language, slots);
    const cached = await redisGet<string[]>(cacheKey).catch(() => null);
    if (Array.isArray(cached) && cached.length === slots.length) {
      return sendJson(response, { language, cached: true, result: applyTranslations(job.result, slots, cached) });
    }

    await assertRedisAvailable();

    const burst = await checkRateLimit(
      "user",
      auth.userId,
      "translate",
      configuredQuota("TRANSLATE_RPM", 5),
    );
    if (!burst.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((burst.resetAt - Date.now()) / 1000))));
      response.setHeader("X-RateLimit-Limit", String(burst.limit));
      response.setHeader("X-RateLimit-Remaining", "0");
      return sendJson(response, { error: "Too many translation requests. Please wait a moment.", code: "RATE_LIMITED" }, 429);
    }

    const cap = dailyLimit();
    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = `translate:${auth.userId}:${today}`;
    const used = await redisIncrement(dailyKey, 1, 60 * 60 * 26);
    if (used > cap) {
      response.setHeader("Retry-After", "3600");
      response.setHeader("X-RateLimit-Limit", String(cap));
      response.setHeader("X-RateLimit-Remaining", "0");
      return sendJson(response, { error: "Daily translation limit reached. Try again tomorrow.", code: "RATE_LIMITED" }, 429);
    }

    const globalBudget = await checkGlobalDailyBudget(
      "translations",
      configuredQuota("GLOBAL_TRANSLATIONS_PER_DAY", 2000),
    );
    if (!globalBudget.allowed) {
      await redisIncrement(dailyKey, -1, 60 * 60 * 26).catch(() => undefined);
      return sendAtCapacityResponse(response, globalBudget.resetAt);
    }

    response.setHeader("X-RateLimit-Limit", String(cap));
    response.setHeader("X-RateLimit-Remaining", String(Math.max(0, cap - used)));

    const translations = await translateStrings(slots.map((slot) => slot.value), language);
    const changed = translations.filter((text, index) => text !== slots[index].value).length;
    // Only cache a translation that actually changed something, so a model outage is not cached.
    if (changed > 0) await redisSet(cacheKey, translations, CACHE_TTL_SECONDS).catch(() => undefined);
    logger.info("Result translated", { comparisonId: id, language, strings: slots.length, changed });

    return sendJson(response, {
      language,
      cached: false,
      translated: changed > 0,
      result: applyTranslations(job.result, slots, translations),
    });
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
    return sendJson(
      response,
      { error: error instanceof z.ZodError ? "Unsupported language." : error instanceof Error ? error.message : "Unable to translate." },
      status,
    );
  }
}
