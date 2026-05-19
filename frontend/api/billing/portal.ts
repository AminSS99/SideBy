import { eq, or } from "drizzle-orm";
import { requireAuth } from "../_lib/auth.js";
import { paddleRequest } from "../_lib/paddle.js";
import { sendJson } from "../_lib/sideby.js";
import { createDbClient } from "../../src/db/index.js";
import { organizations, subscriptions, users } from "../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 20,
};

type PaddlePortalResponse = {
  data: {
    id: string;
    urls?: {
      general?: { overview?: string };
      subscriptions?: Array<{ id: string; overview?: string; cancel_subscription?: string }>;
    };
  };
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
    const db = createDbClient();

    const [user] = await db
      .select({ paddleCustomerId: users.paddleCustomerId })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const [org] = auth.orgId
      ? await db
          .select({ paddleCustomerId: organizations.paddleCustomerId })
          .from(organizations)
          .where(eq(organizations.id, auth.orgId))
          .limit(1)
      : [];

    const customerId = org?.paddleCustomerId || user?.paddleCustomerId;
    if (!customerId) {
      return sendJson(response, { error: "No Paddle customer is linked to this account." }, 404);
    }

    const subscriptionRows = await db
      .select({ paddleSubscriptionId: subscriptions.paddleSubscriptionId })
      .from(subscriptions)
      .where(
        auth.orgId
          ? or(eq(subscriptions.organizationId, auth.orgId), eq(subscriptions.userId, auth.userId))
          : eq(subscriptions.userId, auth.userId),
      );

    const portal = await paddleRequest<PaddlePortalResponse>(
      `/customers/${customerId}/portal-sessions`,
      {
        method: "POST",
        body: JSON.stringify({
          subscription_ids: subscriptionRows.map((row) => row.paddleSubscriptionId),
        }),
      },
    );

    return sendJson(response, {
      portalSessionId: portal.data.id,
      url: portal.data.urls?.general?.overview || portal.data.urls?.subscriptions?.[0]?.overview || null,
      urls: portal.data.urls || null,
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to create billing portal session." },
      status,
    );
  }
}
