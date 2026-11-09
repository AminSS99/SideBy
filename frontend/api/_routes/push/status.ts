/**
 * GET /api/push/status
 * Returns whether push is configured, the public VAPID key for the browser,
 * how many devices are subscribed, and which endpoints belong to this device.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../../_lib/auth.js";
import { sendJson } from "../../_lib/sideby.js";
import { getPublicVapidKey, isPushConfigured, listUserSubscriptions } from "../../_lib/push.js";
import { createDbClient } from "../../../src/db/index.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);

    if (!isPushConfigured()) {
      return sendJson(response, {
        configured: false,
        publicVapidKey: null,
        devices: [],
      });
    }

    const db = createDbClient();
    const subscriptions = await listUserSubscriptions(db, auth.userId);

    return sendJson(response, {
      configured: true,
      publicVapidKey: getPublicVapidKey(),
      devices: subscriptions.map((subscription) => ({
        endpoint: subscription.endpoint,
        // Never return raw keys to the client.
        maskedEndpoint: subscription.endpoint.slice(0, 60),
      })),
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load push status." },
      status,
    );
  }
}
