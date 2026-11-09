/**
 * POST /api/push/subscribe
 * Stores (or refreshes) a Web Push subscription for the authenticated user.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../../_lib/auth.js";
import { sendJson } from "../../_lib/sideby.js";
import { captureServerEvent } from "../../_lib/analytics.js";
import { logger } from "../../_lib/log.js";
import { checkRateLimit } from "../../_lib/rate-limit.js";
import {
  isPushConfigured,
  upsertSubscription,
  validateSubscriptionInput,
} from "../../_lib/push.js";
import { createDbClient } from "../../../src/db/index.js";

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

    const burst = await checkRateLimit("user", auth.userId, "push-subscribe", 10);
    if (!burst.allowed) {
      response.setHeader("Retry-After", Math.ceil((burst.resetAt - Date.now()) / 1000).toString());
      return sendJson(response, { error: "Too many subscription attempts. Try again shortly." }, 429);
    }

    const subscription = validateSubscriptionInput(request.body);
    if (!subscription) {
      return sendJson(response, { error: "A valid Web Push subscription is required." }, 400);
    }

    // Basic safety: only accept endpoints that look like real push services.
    if (!isKnownPushService(subscription.endpoint)) {
      return sendJson(response, { error: "Unsupported push service." }, 400);
    }

    const db = createDbClient();
    const userAgent = Array.isArray(request.headers["user-agent"])
      ? request.headers["user-agent"][0]
      : request.headers["user-agent"];

    const stored = await upsertSubscription(db, auth.userId, subscription, userAgent);

    captureServerEvent(auth.userId, "push_subscription_created", {
      endpoint_host: safeHost(subscription.endpoint),
    });

    logger.info("Push subscription stored", { userId: auth.userId });
    return sendJson(response, {
      subscription: {
        endpoint: stored.endpoint,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to store subscription." },
      status,
    );
  }
}

// The server later POSTs to this URL, so only real browser push services are
// accepted (never arbitrary or internal hosts).
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

export function isKnownPushService(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.port) return false;
    const host = url.hostname.toLowerCase();
    return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

function safeHost(endpoint: string): string | null {
  try {
    return new URL(endpoint).host;
  } catch {
    return null;
  }
}
