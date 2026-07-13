import { eq, sql } from "drizzle-orm";
import { createDbClient } from "../../../src/db/index.js";
import {
  organizations,
  subscriptions,
  users,
  webhookEvents,
} from "../../../src/db/schema.js";
import { readRawBody, verifyDodoWebhookSignature } from "../../_lib/dodo.js";
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

type DodoWebhookPayload = {
  type: string;
  data: {
    subscription_id?: string;
    customer_id?: string;
    status?: string;
    product_id?: string;
    plan_id?: string;
    current_period_start?: string;
    current_period_end?: string;
    current_billing_period?: {
      starts_at?: string;
      ends_at?: string;
    } | null;
    canceled_at?: string | null;
    metadata?: {
      user_id?: string;
      org_id?: string | null;
      plan?: string;
    } | null;
  };
};

function normalizeStatus(status?: string): "active" | "canceled" | "past_due" | "paused" | "trialing" {
  const s = (status || "").toLowerCase();
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "on_hold" || s === "past_due") return "past_due";
  if (s === "paused") return "paused";
  if (s === "cancelled" || s === "canceled" || s === "expired" || s === "failed") return "canceled";
  return "trialing";
}

function normalizePlan(planName?: string, productId?: string): "free" | "pro" | "team" | "business" {
  if (productId === process.env.DODO_PRO_PRODUCT_ID) return "pro";
  if (productId === process.env.DODO_TEAM_PRODUCT_ID) return "team";
  if (productId === process.env.DODO_ENTERPRISE_PRODUCT_ID) return "business";

  const p = (planName || "").toLowerCase();
  if (p === "team") return "team";
  if (p === "enterprise" || p === "business") return "business";
  if (p === "pro") return "pro";
  return "free";
}

/**
 * Pure decision for the past-due billing alert. Returns true only on a genuine
 * transition *into* past_due, so retries and replays of the same event never
 * re-fire the alert. The caller is responsible for reading `previousStatus`
 * under a row lock (see `processDodoWebhook`) so concurrent duplicate
 * deliveries cannot both observe the pre-transition state.
 */
export function shouldAlertOnPastDue(
  previousStatus: string | null | undefined,
  newStatus: string,
): boolean {
  return newStatus === "past_due" && previousStatus !== "past_due";
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
  let payload: DodoWebhookPayload | null = null;

  try {
    rawBody = await readRawBody(request);
    verifyDodoWebhookSignature(rawBody, request.headers);
    payload = JSON.parse(rawBody) as DodoWebhookPayload;

    await db.insert(webhookEvents).values({
      provider: "dodo",
      eventType: payload.type,
      payload,
      signatureValid: true,
      processedAt: new Date(),
    });

    await processDodoWebhook(payload);
    return response.status(200).json({ received: true });
  } catch (error) {
    logger.error("Dodo webhook failed", error instanceof Error ? error : undefined, {
      provider: "dodo",
    });

    await db.insert(webhookEvents).values({
      provider: "dodo",
      eventType: payload?.type || "unknown",
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

async function processDodoWebhook(payload: DodoWebhookPayload) {
  const eventType = payload.type;
  if (!eventType.startsWith("subscription.")) return;

  const data = payload.data;
  const subscriptionId = data.subscription_id;
  if (!subscriptionId) return;

  const userId = data.metadata?.user_id || null;
  const orgId = data.metadata?.org_id || null;
  const customerId = data.customer_id || null;
  const productId = data.product_id || data.plan_id || "unknown";
  const plan = normalizePlan(data.metadata?.plan, productId);
  const newStatus = normalizeStatus(data.status);
  const periodStartStr = data.current_period_start || data.current_billing_period?.starts_at;
  const periodEndStr = data.current_period_end || data.current_billing_period?.ends_at;

  const db = createDbClient();

  // Wrap the read-compare-write in a transaction. We lock the existing
  // subscription row (if any) so concurrent duplicate deliveries from the
  // provider cannot both observe "not yet past_due" and each fire an alert.
  // The advisory lock also covers the first delivery, before a subscription
  // row exists for SELECT ... FOR UPDATE to lock.
  // The alert is only sent on a genuine transition *into* past_due, which
  // makes the handler idempotent under retries and replays.
  const shouldSendPastDueAlert = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${subscriptionId}))`);

    const [existing] = await tx
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, subscriptionId))
      .for("update");

    if (customerId && userId) {
      await tx
        .update(users)
        .set({ providerCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    if (customerId && orgId) {
      await tx
        .update(organizations)
        .set({
          providerCustomerId: customerId,
          plan,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId));
    }

    await tx
      .insert(subscriptions)
      .values({
        organizationId: orgId,
        userId,
        providerSubscriptionId: subscriptionId,
        providerPlanId: productId,
        status: newStatus,
        currentPeriodStart: parseDate(periodStartStr),
        currentPeriodEnd: parseDate(periodEndStr),
        canceledAt: parseDate(data.canceled_at),
      })
      .onConflictDoUpdate({
        target: subscriptions.providerSubscriptionId,
        set: {
          organizationId: orgId,
          userId,
          providerPlanId: productId,
          status: newStatus,
          currentPeriodStart: parseDate(periodStartStr),
          currentPeriodEnd: parseDate(periodEndStr),
          canceledAt: parseDate(data.canceled_at),
          updatedAt: new Date(),
        },
      });

    const previousStatus = existing?.status ?? null;
    return shouldAlertOnPastDue(previousStatus, newStatus) && Boolean(userId);
  });

  if (shouldSendPastDueAlert) {
    await sendBillingAlert({
      userId: userId!,
      subject: "SideBy billing needs attention",
      message: "Your SideBy subscription is past due. Please update your payment method in the billing portal.",
    }).catch((error) => {
      logger.warn("Billing alert email failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}
