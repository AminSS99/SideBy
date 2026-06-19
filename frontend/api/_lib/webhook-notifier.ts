import crypto from "crypto";
import { and, eq, isNull, or } from "drizzle-orm";
import { webhookSubscriptions, comparisons } from "../../src/db/schema.js";
import { createDbClient } from "../../src/db/index.js";
import { logger } from "./log.js";

export function signPayload(payloadString: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signaturePayload)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

type DbClient = ReturnType<typeof createDbClient>;

export async function triggerWebhooks(
  db: DbClient,
  comparisonId: string,
  eventType: "comparison.completed" | "comparison.failed",
  dataPayload: Record<string, unknown>,
  waitUntil?: (promise: Promise<unknown>) => void
): Promise<void> {
  try {
    // 1. Fetch the comparison to identify tenant ownership
    const [comp] = await db
      .select({
        id: comparisons.id,
        clerkUserId: comparisons.clerkUserId,
        clerkOrgId: comparisons.clerkOrgId,
        workspaceId: comparisons.workspaceId,
        query: comparisons.query,
        slug: comparisons.slug,
      })
      .from(comparisons)
      .where(eq(comparisons.id, comparisonId))
      .limit(1);

    if (!comp) {
      logger.error("Webhook trigger failed: comparison not found", undefined, { comparisonId });
      return;
    }

    // 2. Build whereClause based on organization or personal scope
    let whereClause;
    if (comp.clerkOrgId) {
      whereClause = and(
        eq(webhookSubscriptions.active, true),
        eq(webhookSubscriptions.organizationId, comp.clerkOrgId),
        or(
          isNull(webhookSubscriptions.workspaceId),
          comp.workspaceId ? eq(webhookSubscriptions.workspaceId, comp.workspaceId) : isNull(webhookSubscriptions.workspaceId)
        )
      );
    } else if (comp.clerkUserId) {
      whereClause = and(
        eq(webhookSubscriptions.active, true),
        eq(webhookSubscriptions.userId, comp.clerkUserId),
        isNull(webhookSubscriptions.organizationId),
        or(
          isNull(webhookSubscriptions.workspaceId),
          comp.workspaceId ? eq(webhookSubscriptions.workspaceId, comp.workspaceId) : isNull(webhookSubscriptions.workspaceId)
        )
      );
    } else {
      logger.info("Skipping webhooks: comparison has no owner", { comparisonId });
      return;
    }

    // 3. Query all active webhook subscriptions
    const subs = await db
      .select()
      .from(webhookSubscriptions)
      .where(whereClause);

    // 4. Filter in-memory by eventType
    const matchingSubs = subs.filter((sub: typeof webhookSubscriptions.$inferSelect) => {
      const types = Array.isArray(sub.eventTypes) ? sub.eventTypes : [];
      return types.includes(eventType);
    });

    if (matchingSubs.length === 0) {
      logger.info("No matching active webhook subscriptions found", { comparisonId, eventType });
      return;
    }

    // 5. Construct event payload
    const eventPayload = {
      id: `evt_${crypto.randomBytes(16).toString("hex")}`,
      event: eventType,
      created_at: Math.floor(Date.now() / 1000),
      data: {
        id: comp.id,
        query: comp.query,
        slug: comp.slug,
        status: eventType === "comparison.completed" ? "completed" : "failed",
        ...dataPayload,
      },
    };

    const payloadString = JSON.stringify(eventPayload);

    // 6. Dispatch requests asynchronously
    const dispatches = matchingSubs.map(async (sub: typeof webhookSubscriptions.$inferSelect) => {
      const signature = signPayload(payloadString, sub.secret);
      const url = sub.url;

      try {
        logger.info("Dispatching webhook", { url, eventType, comparisonId });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SideBy-Signature": signature,
            "User-Agent": "SideBy-Webhook/1.0",
          },
          body: payloadString,
        });

        if (!res.ok) {
          logger.warn("Webhook endpoint returned error status", {
            url,
            status: res.status,
            comparisonId,
          });
        } else {
          logger.info("Webhook delivered successfully", { url, comparisonId });
        }
      } catch (err) {
        logger.error("Failed to deliver webhook", err instanceof Error ? err : undefined, {
          url,
          comparisonId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    // 7. Leverage Vercel waitUntil if available
    if (waitUntil) {
      waitUntil(Promise.all(dispatches));
    } else {
      await Promise.all(dispatches);
    }
  } catch (error) {
    logger.error("Error triggering webhooks", error instanceof Error ? error : undefined, {
      comparisonId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
