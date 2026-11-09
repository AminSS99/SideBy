/**
 * SideBy Web Push (VAPID)
 * Stores per-device subscriptions for authenticated Clerk users and delivers
 * clearly-typed notifications when a comparison completes or fails — never on
 * progress updates.
 */
import { and, eq } from "drizzle-orm";
import webpush from "web-push";
import { z } from "zod";
import { createDbClient, type DbClient } from "../../src/db/index.js";
import { pushSubscriptions } from "../../src/db/schema.js";
import { logger } from "./log.js";

// ─── Configuration ──────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@sideby.ink";

const APP_URL = (process.env.VITE_APP_URL || "https://sideby.ink").replace(/\/+$/, "");

export const isPushConfigured = (): boolean =>
  VAPID_PUBLIC_KEY.length > 0 && VAPID_PRIVATE_KEY.length > 0;

let vapidConfigured = false;
function ensureVapid(): boolean {
  if (!isPushConfigured()) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }
  return true;
}

export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY;
}

// ─── Payload contract ───────────────────────────────────────────────────────

export const PUSH_NOTIFICATION_TYPES = [
  "comparison.completed",
  "comparison.failed",
  "test",
] as const;

export type PushNotificationType = (typeof PUSH_NOTIFICATION_TYPES)[number];

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  type: PushNotificationType;
  comparisonId?: string;
}

const truncate = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

/**
 * Pure builders so payloads are deterministic and unit-testable.
 * `url` is a path — the service worker resolves it against its own origin,
 * which also guarantees same-origin navigation targets.
 */
export function buildComparisonCompletedPayload(params: {
  comparisonId: string;
  query: string;
}): PushPayload {
  return {
    type: "comparison.completed",
    title: "Research complete",
    body: `Your comparison "${truncate(params.query, 120)}" is ready to review.`,
    url: `/app/comparisons/${params.comparisonId}`,
    tag: `comparison:${params.comparisonId}`,
    comparisonId: params.comparisonId,
  };
}

export function buildComparisonFailedPayload(params: {
  comparisonId: string;
  query: string;
}): PushPayload {
  return {
    type: "comparison.failed",
    title: "Research needs attention",
    body: `"${truncate(params.query, 105)}" needs attention. Open it to retry.`,
    url: `/app/comparisons/${params.comparisonId}`,
    tag: `comparison:${params.comparisonId}`,
    comparisonId: params.comparisonId,
  };
}

/** Clearly labeled test notification — never used for production messaging. */
export function buildTestPayload(): PushPayload {
  return {
    type: "test",
    title: "[SideBy Test] Notifications enabled",
    body: "This is a test notification. You will be alerted when research completes or fails.",
    url: "/app/settings?tab=notifications",
    tag: `sideby:test:${Date.now()}`,
  };
}

// ─── Subscription storage ───────────────────────────────────────────────────

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const SubscriptionInputSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(512),
  }),
  expirationTime: z.number().nullable().optional(),
});

export type SubscriptionInput = z.infer<typeof SubscriptionInputSchema>;

export function validateSubscriptionInput(body: unknown): SubscriptionInput | null {
  const parsed = SubscriptionInputSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

const MAX_SUBSCRIPTIONS_PER_USER = 10;

export async function upsertSubscription(
  db: DbClient,
  clerkUserId: string,
  input: SubscriptionInput,
  userAgent?: string,
): Promise<StoredPushSubscription> {
  const [row] = await db
    .insert(pushSubscriptions)
    .values({
      clerkUserId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      expirationTime: input.expirationTime ? new Date(input.expirationTime) : null,
      userAgent: userAgent?.slice(0, 400) ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        clerkUserId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        expirationTime: input.expirationTime ? new Date(input.expirationTime) : null,
        userAgent: userAgent?.slice(0, 400) ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  await pruneExcessSubscriptions(db, clerkUserId);

  return row as StoredPushSubscription;
}

async function pruneExcessSubscriptions(db: DbClient, clerkUserId: string): Promise<void> {
  const rows = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.clerkUserId, clerkUserId));

  // Newest rows were just upserted; drop the oldest beyond the device cap.
  const excessIds = rows.slice(0, Math.max(0, rows.length - MAX_SUBSCRIPTIONS_PER_USER));
  for (const row of excessIds) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
  }
}

export async function removeSubscription(
  db: DbClient,
  clerkUserId: string,
  endpoint: string,
): Promise<boolean> {
  const removed = await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.clerkUserId, clerkUserId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    )
    .returning({ id: pushSubscriptions.id });
  return removed.length > 0;
}

export async function removeAllSubscriptions(
  db: DbClient,
  clerkUserId: string,
): Promise<number> {
  const removed = await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.clerkUserId, clerkUserId))
    .returning({ id: pushSubscriptions.id });
  return removed.length;
}

export async function listUserSubscriptions(
  db: DbClient,
  clerkUserId: string,
): Promise<StoredPushSubscription[]> {
  const rows = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.clerkUserId, clerkUserId));
  return rows;
}

// ─── Delivery ───────────────────────────────────────────────────────────────

export interface DeliveryResult {
  ok: boolean;
  expired: boolean;
  error?: string;
}

export type PushDeliveryFn = (
  subscription: StoredPushSubscription,
  payload: PushPayload,
) => Promise<DeliveryResult>;

export type PushSender = typeof webpush.sendNotification;

/** Default delivery via web-push; maps 404/410 to "expired subscription". */
export const deliverToSubscription = async (
  subscription: StoredPushSubscription,
  payload: PushPayload,
  sendNotification: PushSender = webpush.sendNotification.bind(webpush),
): Promise<DeliveryResult> => {
  if (!ensureVapid()) {
    return { ok: false, expired: false, error: "push-not-configured" };
  }

  try {
    await sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }, // 24h — notifications older than a day are noise
    );
    return { ok: true, expired: false };
  } catch (error) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode: unknown }).statusCode)
        : undefined;

    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, expired: true, error: `subscription-${statusCode}` };
    }

    return {
      ok: false,
      expired: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export interface DeliverySummary {
  sent: number;
  failed: number;
  expiredEndpoints: string[];
}

/**
 * Send one payload to every subscription of a user. Expired endpoints
 * (404/410 from the push service) are returned so callers can prune them.
 */
export async function sendPayloadToSubscriptions(
  subscriptions: StoredPushSubscription[],
  payload: PushPayload,
  deliver: PushDeliveryFn = deliverToSubscription,
): Promise<DeliverySummary> {
  const summary: DeliverySummary = { sent: 0, failed: 0, expiredEndpoints: [] };

  for (const subscription of subscriptions) {
    let result: DeliveryResult;
    try {
      result = await deliver(subscription, payload);
    } catch (error) {
      result = {
        ok: false,
        expired: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    if (result.ok) {
      summary.sent++;
    } else {
      summary.failed++;
      if (result.expired) {
        summary.expiredEndpoints.push(subscription.endpoint);
      }
    }
  }

  return summary;
}

export async function notifyUserOfComparisonEvent(params: {
  userId: string;
  payload: PushPayload;
}): Promise<DeliverySummary | null> {
  if (!isPushConfigured()) return null;

  try {
    const db = createDbClient();
    const subscriptions = await listUserSubscriptions(db, params.userId);
    if (subscriptions.length === 0) return null;

    const summary = await sendPayloadToSubscriptions(subscriptions, params.payload);

    // Prune dead endpoints so future sends stay fast.
    if (summary.expiredEndpoints.length > 0) {
      for (const endpoint of summary.expiredEndpoints) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, endpoint));
      }
      logger.info("Pruned expired push subscriptions", {
        count: summary.expiredEndpoints.length,
      });
    }

    logger.info("Delivered push notifications", {
      type: params.payload.type,
      sent: summary.sent,
      failed: summary.failed,
      pruned: summary.expiredEndpoints.length,
    });

    return summary;
  } catch (error) {
    logger.warn("Push notification delivery failed", {
      type: params.payload.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
