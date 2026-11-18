/**
 * POST /api/comparisons/:id/translate
 * Returns the stored result with its prose translated to Azerbaijani or Russian.
 * Cached per (comparison, language, content), capped per user per day.
 */
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson, getComparisonJob } from "../../../_lib/sideby.js";
import { requireAuth } from "../../../_lib/auth.js";
import { redisGet, redisIncrement, redisSet } from "../../../_lib/redis.js";
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

    const today = new Date().toISOString().slice(0, 10);
    const used = await redisIncrement(`translate:${auth.userId}:${today}`, 1, 60 * 60 * 26);
    if (used > dailyLimit()) {
      response.setHeader("Retry-After", "3600");
      return sendJson(response, { error: "Daily translation limit reached. Try again tomorrow." }, 429);
    }

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
