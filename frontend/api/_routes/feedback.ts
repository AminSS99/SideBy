/**
 * POST /api/feedback — Durable user feedback persistence (Postgres usage_events + PostHog server + Better Stack)
 * GET  /api/feedback — Authenticated user's own submitted feedback history
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, and, eq } from "drizzle-orm";
import { z } from "zod";
import { createDbClient } from "../../src/db/index.js";
import { usageEvents } from "../../src/db/schema.js";
import { authenticateRequest, requireAuth } from "../_lib/auth.js";
import { assertCsrfForRequest } from "../_lib/csrf.js";
import { sendJson } from "../_lib/sideby.js";
import { captureServerEvent } from "../_lib/analytics.js";
import { logger } from "../_lib/log.js";
import { checkRateLimit } from "../_lib/rate-limit.js";

function extractClientIp(request: VercelRequest): string {
  const fwd = request.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) {
    return fwd.split(",")[0].trim();
  }
  if (Array.isArray(fwd) && fwd[0]) {
    return fwd[0].split(",")[0].trim();
  }
  return request.socket?.remoteAddress || "unknown";
}

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

const FeedbackBodySchema = z.object({
  type: z.enum(["comparison_rating", "general_feedback", "bug", "feature"]).default("general_feedback"),
  rating: z.number().int().min(-1).max(5).optional(),
  reasons: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  message: z.string().trim().max(2000).optional(),
  comparisonId: z.string().uuid().optional(),
  pageUrl: z.string().trim().max(300).optional(),
  language: z.enum(["en", "az", "ru"]).optional(),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === "GET") {
    try {
      const auth = await requireAuth(request);
      const db = createDbClient();
      const rows = await db
        .select({
          id: usageEvents.id,
          metadata: usageEvents.metadata,
          createdAt: usageEvents.createdAt,
        })
        .from(usageEvents)
        .where(
          and(
            eq(usageEvents.clerkUserId, auth.userId),
            eq(usageEvents.eventType, "user_feedback"),
          ),
        )
        .orderBy(desc(usageEvents.createdAt))
        .limit(50);

      return sendJson(response, { feedback: rows });
    } catch (error) {
      const status =
        error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 401;
      return sendJson(response, { error: "Authentication required." }, status);
    }
  }

  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    assertCsrfForRequest(request);
    const auth = await authenticateRequest(request);
    const clientIp = extractClientIp(request);
    const rate = await checkRateLimit(
      auth.userId ? "user" : "ip",
      auth.userId || clientIp,
      "feedback",
      10,
    );
    if (!rate.allowed) {
      return sendJson(response, { error: "Too many feedback submissions. Please try again later." }, 429);
    }

    const parsed = FeedbackBodySchema.parse(request.body || {});
    const distinctId = auth.userId || `anon:${clientIp}`;

    const metadata = {
      type: parsed.type,
      rating: parsed.rating ?? null,
      reasons: parsed.reasons ?? [],
      message: parsed.message || null,
      comparisonId: parsed.comparisonId ?? null,
      pageUrl: parsed.pageUrl ?? null,
      language: parsed.language ?? null,
    };

    try {
      const db = createDbClient();
      await db.insert(usageEvents).values({
        clerkUserId: auth?.userId ?? null,
        clerkOrgId: auth?.orgId ?? null,
        eventType: "user_feedback",
        metadata,
      });
    } catch (dbError) {
      logger.warn("Failed to persist user feedback to Postgres; continuing with analytics", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    captureServerEvent(distinctId, "user_feedback_submitted", {
      ...metadata,
      authenticated: Boolean(auth?.userId),
    });

    logger.info("User feedback received", {
      userId: auth?.userId ?? "anonymous",
      ...metadata,
    });

    return sendJson(response, { ok: true }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendJson(response, { error: error.errors[0]?.message || "Invalid feedback payload." }, 400);
    }
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    if (status < 500) {
      return sendJson(response, { error: error instanceof Error ? error.message : "Forbidden." }, status);
    }
    logger.error("Feedback handler error", error instanceof Error ? error : undefined);
    return sendJson(response, { error: "Unable to save feedback." }, 500);
  }
}
