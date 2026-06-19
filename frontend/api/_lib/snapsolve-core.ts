import { createHmac } from "node:crypto";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import { snapSolveOutbox } from "../../src/db/schema.js";
import { serverEnv } from "./env.js";
import { logger } from "./log.js";

const PRODUCT_SLUG = "sideby";

type SnapSolveEventType = "sideby.comparison.completed" | "sideby.decision.saved";
type SnapSolveOutboxRow = typeof snapSolveOutbox.$inferSelect;

export type SnapSolveWorkspaceSession = {
  snapsolve_user_id: string;
  product: string;
  workspace: {
    id: string;
    name: string;
    slug: string | null;
    plan: string | null;
  } | null;
  products: Array<{
    slug: string;
    name: string;
    tagline: string | null;
    icon_url: string | null;
    launch_url: string | null;
    status: string;
    enabled: boolean;
    entitlement: {
      allowed: boolean;
      reason: string | null;
      plan: string | null;
      source: string | null;
    } | null;
  }>;
  reason: string | null;
};

export type SnapSolveEntitlement = {
  allowed: boolean;
  snapsolve_user_id: string | null;
  workspace_id: string | null;
  product: string;
  feature: string;
  source: string | null;
  plan: string | null;
  reason?: string | null;
  expires_at?: string | null;
};

function getConfig() {
  const coreUrl = serverEnv.snapsolveCoreUrl?.replace(/\/+$/, "");
  const secret = serverEnv.snapsolveSidebySecret;
  return coreUrl && secret ? { coreUrl, secret } : null;
}

function signPayload(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

function safeMetadata(metadata: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const key of ["comparison_id", "decision_id", "project_id", "workspace_id", "status", "category", "source"]) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

async function postEvent(row: SnapSolveOutboxRow) {
  const config = getConfig();
  if (!config) return false;

  const body = JSON.stringify({
    clerk_user_id: row.clerkUserId,
    email: row.email,
    event_id: row.eventId,
    event_type: row.eventType,
    event_version: 1,
    metadata: row.metadata ?? {},
    occurred_at: row.createdAt.toISOString(),
    product: PRODUCT_SLUG,
    product_user_id: row.productUserId,
    trace_id: row.id,
    workspace_id: row.workspaceId,
  });
  const timestamp = new Date().toISOString();
  const response = await fetch(`${config.coreUrl}/api/core/v1/events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-snapsolve-product": PRODUCT_SLUG,
      "x-snapsolve-signature": `sha256=${signPayload(config.secret, timestamp, body)}`,
      "x-snapsolve-timestamp": timestamp,
    },
    body,
    signal: AbortSignal.timeout(3_000),
  });

  if (!response.ok) {
    throw new Error(`SnapSolve Core event ingestion failed with ${response.status}: ${await response.text()}`);
  }

  return true;
}

async function postSignedJson<T>(endpoint: string, payload: Record<string, unknown>): Promise<T | null> {
  const config = getConfig();
  if (!config) return null;

  const body = JSON.stringify({ ...payload, product: PRODUCT_SLUG });
  const timestamp = new Date().toISOString();
  const response = await fetch(`${config.coreUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-snapsolve-product": PRODUCT_SLUG,
      "x-snapsolve-signature": `sha256=${signPayload(config.secret, timestamp, body)}`,
      "x-snapsolve-timestamp": timestamp,
    },
    body,
    signal: AbortSignal.timeout(3_000),
  });

  if (!response.ok) {
    throw new Error(`SnapSolve Core ${endpoint} failed with ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

export async function resolveSnapSolveWorkspaceSession(args: {
  clerkUserId: string;
  email?: string | null;
}): Promise<SnapSolveWorkspaceSession | null> {
  try {
    return await postSignedJson<SnapSolveWorkspaceSession>("/api/core/v1/workspaces/resolve", {
      clerk_user_id: args.clerkUserId,
      email: args.email ?? null,
      email_verified: Boolean(args.email),
      product_user_id: args.clerkUserId,
    });
  } catch (error) {
    logger.warn("SnapSolve workspace session unavailable", {
      error: error instanceof Error ? error.message : String(error),
      userId: args.clerkUserId,
    });
    return null;
  }
}

export async function checkSnapSolveEntitlement(args: {
  clerkUserId: string;
  email?: string | null;
  feature?: string | null;
  workspaceId?: string | null;
}): Promise<SnapSolveEntitlement | null> {
  try {
    return await postSignedJson<SnapSolveEntitlement>("/api/core/v1/entitlements/check", {
      clerk_user_id: args.clerkUserId,
      email: args.email ?? null,
      email_verified: Boolean(args.email),
      feature: args.feature ?? "*",
      product_user_id: args.clerkUserId,
      workspace_id: args.workspaceId ?? null,
    });
  } catch (error) {
    logger.warn("SnapSolve entitlement check unavailable", {
      error: error instanceof Error ? error.message : String(error),
      userId: args.clerkUserId,
    });
    return null;
  }
}

export async function queueSnapSolveEvent(args: {
  eventType: SnapSolveEventType;
  idempotencyKey: string;
  clerkUserId: string | null;
  workspaceId?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = createDbClient();
  const productUserId = args.clerkUserId ?? "anonymous";
  const metadata = {
    ...safeMetadata(args.metadata ?? {}),
    source: "sideby",
  };

  await db
    .insert(snapSolveOutbox)
    .values({
      clerkUserId: args.clerkUserId,
      email: args.email ?? null,
      eventId: `${args.eventType}:${args.idempotencyKey}`,
      eventType: args.eventType,
      metadata,
      product: PRODUCT_SLUG,
      productUserId,
      status: "queued",
      workspaceId: args.workspaceId ?? null,
    })
    .onConflictDoNothing({ target: snapSolveOutbox.eventId });
}

export async function flushSnapSolveOutbox(limit = 25) {
  const db = createDbClient();
  const rows = await db
    .select()
    .from(snapSolveOutbox)
    .where(and(eq(snapSolveOutbox.status, "queued"), lte(snapSolveOutbox.nextAttemptAt, new Date())))
    .orderBy(asc(snapSolveOutbox.createdAt))
    .limit(limit);

  let delivered = 0;
  for (const row of rows) {
    try {
      const sent = await postEvent(row);
      if (!sent) break;
      await db
        .update(snapSolveOutbox)
        .set({
          deliveredAt: new Date(),
          lastError: null,
          status: "delivered",
          updatedAt: new Date(),
        })
        .where(eq(snapSolveOutbox.id, row.id));
      delivered += 1;
    } catch (error) {
      const attempts = row.attemptCount + 1;
      logger.warn("SnapSolve outbox delivery failed", {
        attempts,
        eventId: row.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      await db
        .update(snapSolveOutbox)
        .set({
          attemptCount: attempts,
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown SnapSolve Core error",
          nextAttemptAt: sql`now() + (${Math.min(900, 30 * attempts)} || ' seconds')::interval`,
          status: attempts >= 10 ? "failed" : "queued",
          updatedAt: new Date(),
        })
        .where(eq(snapSolveOutbox.id, row.id));
    }
  }

  return { delivered, scanned: rows.length };
}
