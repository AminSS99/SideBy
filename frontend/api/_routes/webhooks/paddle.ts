import { eq } from "drizzle-orm";
import { createDbClient } from "../../../src/db/index.js";
import {
  organizations,
  subscriptions,
  users,
  webhookEvents,
} from "../../../src/db/schema.js";
import { readRawBody, verifyPaddleWebhookSignature } from "../../_lib/paddle.js";
import { logger } from "../../_lib/log.js";
import { sendBillingAlert } from "../../_lib/email.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 20,
  api: {
    bodyParser: false,
  },
};

type PaddleSubscriptionStatus = "active" | "canceled" | "past_due" | "paused" | "trialing";

type PaddleWebhookPayload = {
  event_type: string;
  data: {
    id?: string;
    status?: string;
    customer_id?: string;
    custom_data?: {
      user_id?: string;
      org_id?: string | null;
      plan?: string;
    } | null;
    current_billing_period?: {
      starts_at?: string;
      ends_at?: string;
    } | null;
    canceled_at?: string | null;
    items?: Array<{
      price?: { id?: string };
    }>;
  };
};

function normalizeStatus(status?: string): PaddleSubscriptionStatus {
  if (status === "active" || status === "past_due" || status === "paused" || status === "trialing") {
    return status;
  }
  if (status === "canceled" || status === "cancelled") return "canceled";
  return "trialing";
}

function normalizePlan(plan?: string): "free" | "pro" | "team" | "business" {
  if (plan === "team") return "team";
  if (plan === "enterprise" || plan === "business") return "business";
  if (plan === "pro") return "pro";
  return "free";
}

function parseDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const db = createDbClient();
  let rawBody = "";
  let payload: PaddleWebhookPayload | null = null;

  try {
    rawBody = await readRawBody(request);
    verifyPaddleWebhookSignature(rawBody, request.headers["paddle-signature"]);
    payload = JSON.parse(rawBody) as PaddleWebhookPayload;

    await db.insert(webhookEvents).values({
      provider: "paddle",
      eventType: payload.event_type,
      payload,
      signatureValid: true,
      processedAt: new Date(),
    });

    await processPaddleWebhook(payload);
    return response.status(200).json({ received: true });
  } catch (error) {
    logger.error("Paddle webhook failed", error instanceof Error ? error : undefined, {
      provider: "paddle",
    });

    await db.insert(webhookEvents).values({
      provider: "paddle",
      eventType: payload?.event_type || "unknown",
      payload: payload || (rawBody ? { rawBody: rawBody.slice(0, 4000) } : null),
      signatureValid: false,
      processedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Webhook processing failed",
    }).catch((dbErr) => {
      logger.error("Failed to log webhook error event", dbErr instanceof Error ? dbErr : undefined);
    });

    return response.status(400).json({
      error: error instanceof Error ? error.message : "Webhook processing failed",
    });
  }
}

async function processPaddleWebhook(payload: PaddleWebhookPayload) {
  const eventType = payload.event_type;
  if (!eventType.startsWith("subscription.")) return;

  const data = payload.data;
  const subscriptionId = data.id;
  if (!subscriptionId) return;

  const userId = data.custom_data?.user_id || null;
  const orgId = data.custom_data?.org_id || null;
  const customerId = data.customer_id || null;
  const plan = normalizePlan(data.custom_data?.plan);
  const priceId = data.items?.[0]?.price?.id || "unknown";
  const db = createDbClient();

  if (customerId && userId) {
    await db
      .update(users)
      .set({ paddleCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  if (customerId && orgId) {
    await db
      .update(organizations)
      .set({
        paddleCustomerId: customerId,
        plan,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
  }

  await db
    .insert(subscriptions)
    .values({
      organizationId: orgId,
      userId,
      paddleSubscriptionId: subscriptionId,
      paddlePlanId: priceId,
      status: normalizeStatus(data.status),
      currentPeriodStart: parseDate(data.current_billing_period?.starts_at),
      currentPeriodEnd: parseDate(data.current_billing_period?.ends_at),
      canceledAt: parseDate(data.canceled_at),
    })
    .onConflictDoUpdate({
      target: subscriptions.paddleSubscriptionId,
      set: {
        organizationId: orgId,
        userId,
        paddlePlanId: priceId,
        status: normalizeStatus(data.status),
        currentPeriodStart: parseDate(data.current_billing_period?.starts_at),
        currentPeriodEnd: parseDate(data.current_billing_period?.ends_at),
        canceledAt: parseDate(data.canceled_at),
        updatedAt: new Date(),
      },
    });

  if (normalizeStatus(data.status) === "past_due" && userId) {
    await sendBillingAlert({
      userId,
      subject: "SideBy billing needs attention",
      message: "Your SideBy subscription is past due. Please update your payment method in the billing portal.",
    }).catch((error) => {
      logger.warn("Billing alert email failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}
