/**
 * POST /api/push/test
 * Sends ONE clearly-labeled test notification to the authenticated user's
 * devices. This endpoint exists so users can verify their setup — it must
 * never be used for production messaging.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../../_lib/auth.js";
import { sendJson } from "../../_lib/sideby.js";
import { captureServerEvent } from "../../_lib/analytics.js";
import { checkRateLimit } from "../../_lib/rate-limit.js";
import {
  buildTestPayload,
  isPushConfigured,
  listUserSubscriptions,
  sendPayloadToSubscriptions,
} from "../../_lib/push.js";
import { createDbClient } from "../../../src/db/index.js";
import { pushSubscriptions } from "../../../src/db/schema.js";
import { eq } from "drizzle-orm";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);

    if (!isPushConfigured()) {
      return sendJson(response, { error: "Push notifications are not configured." }, 503);
    }

    // Hard cap: three labeled tests per minute per user.
    const burst = await checkRateLimit("user", auth.userId, "push-test", 3);
    if (!burst.allowed) {
      response.setHeader("Retry-After", Math.ceil((burst.resetAt - Date.now()) / 1000).toString());
      return sendJson(response, { error: "Test notifications are limited to 3 per minute." }, 429);
    }

    const db = createDbClient();
    const subscriptions = await listUserSubscriptions(db, auth.userId);

    if (subscriptions.length === 0) {
      return sendJson(response, { error: "No devices are subscribed yet." }, 400);
    }

    // The payload is explicitly marked as a test.
    const payload = buildTestPayload();
    const summary = await sendPayloadToSubscriptions(subscriptions, payload);

    if (summary.expiredEndpoints.length > 0) {
      for (const endpoint of summary.expiredEndpoints) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
      }
    }

    captureServerEvent(auth.userId, "push_test_sent", {
      sent: summary.sent,
      failed: summary.failed,
    });

    return sendJson(response, { ok: true, sent: summary.sent, failed: summary.failed });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to send test notification." },
      status,
    );
  }
}
