/**
 * POST /api/push/unsubscribe
 * Removes the current device subscription, or all of the user's devices with
 * `{ all: true }`.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireAuth } from "../../_lib/auth.js";
import { sendJson } from "../../_lib/sideby.js";
import { captureServerEvent } from "../../_lib/analytics.js";
import {
  removeAllSubscriptions,
  removeSubscription,
} from "../../_lib/push.js";
import { createDbClient } from "../../../src/db/index.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

const UnsubscribeBodySchema = z.object({
  endpoint: z.string().url().max(2048).optional(),
  all: z.boolean().optional(),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const body = UnsubscribeBodySchema.safeParse(request.body ?? {});
    if (!body.success) {
      return sendJson(response, { error: "Invalid unsubscribe payload." }, 400);
    }

    const db = createDbClient();

    if (body.data.all) {
      const removed = await removeAllSubscriptions(db, auth.userId);
      captureServerEvent(auth.userId, "push_subscription_removed_all", { removed });
      return sendJson(response, { removed });
    }

    if (!body.data.endpoint) {
      return sendJson(response, { error: "Provide an endpoint or set all=true." }, 400);
    }

    const removed = await removeSubscription(db, auth.userId, body.data.endpoint);
    captureServerEvent(auth.userId, "push_subscription_removed", { removed });
    return sendJson(response, { removed });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to remove subscription." },
      status,
    );
  }
}
