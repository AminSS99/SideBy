/**
 * Clerk webhook handler.
 * Idempotently mirrors Clerk users, orgs, and memberships into Neon.
 *
 * Required env: CLERK_WEBHOOK_SECRET (set in Clerk Dashboard)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Webhook } from "svix";
import { createDbClient } from "../../../src/db/index.js";
import {
  users,
  organizations,
  memberships,
  workspaces,
} from "../../../src/db/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../_lib/log.js";
import { captureServerEvent } from "../../_lib/analytics.js";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";

interface WebhookPayload {
  type: string;
  data: Record<string, unknown>;
}

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = verifyWebhook(request);
    await processWebhook(payload);
    return response.status(200).json({ received: true });
  } catch (error) {
    logger.error(
      "Webhook processing failed",
      error instanceof Error ? error : undefined,
      {
        provider: "clerk",
      },
    );
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    return response.status(400).json({ error: message });
  }
}

function verifyWebhook(request: VercelRequest): WebhookPayload {
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "CLERK_WEBHOOK_SECRET is not configured. Set it in your environment variables.",
    );
  }

  const svix_id = request.headers["svix-id"] as string;
  const svix_timestamp = request.headers["svix-timestamp"] as string;
  const svix_signature = request.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error(
      "Missing Svix headers. Ensure the webhook is sent by Clerk.",
    );
  }

  const body = JSON.stringify(request.body);
  const wh = new Webhook(WEBHOOK_SECRET);

  try {
    const payload = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookPayload;

    if (!payload || !payload.type || !payload.data) {
      throw new Error("Invalid webhook payload structure.");
    }

    return payload;
  } catch (err) {
    throw new Error(
      `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown error"}`,
    );
  }
}

async function processWebhook(payload: WebhookPayload) {
  const db = createDbClient();
  const { type, data } = payload;

  switch (type) {
    case "user.created":
    case "user.updated": {
      const userData = data as {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      };
      const email = userData.email_addresses?.[0]?.email_address ?? null;
      const name =
        [userData.first_name, userData.last_name].filter(Boolean).join(" ") ||
        null;

      await db
        .insert(users)
        .values({
          id: userData.id,
          email,
          name,
          avatarUrl: userData.image_url ?? null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { email, name, avatarUrl: userData.image_url ?? null },
        });

      // Ensure personal workspace exists
      await ensurePersonalWorkspace(db, userData.id, name || email || "User");

      if (type === "user.created") {
        captureServerEvent(userData.id, "user_signed_up", {
          email,
          name,
          source: "clerk_webhook",
        });
      }
      break;
    }

    case "user.deleted": {
      const userId = (data as { id: string }).id;
      await db.delete(users).where(eq(users.id, userId));
      break;
    }

    case "organization.created":
    case "organization.updated": {
      const orgData = data as {
        id: string;
        slug?: string;
        name?: string;
        image_url?: string;
      };
      await db
        .insert(organizations)
        .values({
          id: orgData.id,
          slug: orgData.slug || orgData.id,
          name: orgData.name || null,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            slug: orgData.slug || orgData.id,
            name: orgData.name || null,
          },
        });

      // Ensure team workspace exists
      await ensureTeamWorkspace(db, orgData.id, orgData.name || "Team");
      break;
    }

    case "organization.deleted": {
      const orgId = (data as { id: string }).id;
      await db.delete(organizations).where(eq(organizations.id, orgId));
      break;
    }

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const memData = data as {
        id: string;
        public_user_data: { user_id: string };
        organization: { id: string };
        role?: string;
      };
      await db
        .insert(memberships)
        .values({
          id: memData.id,
          userId: memData.public_user_data.user_id,
          organizationId: memData.organization.id,
          role: normalizeRole(memData.role),
        })
        .onConflictDoUpdate({
          target: memberships.id,
          set: {
            role: normalizeRole(memData.role),
          },
        });
      break;
    }

    case "organizationMembership.deleted": {
      const memId = (data as { id: string }).id;
      await db.delete(memberships).where(eq(memberships.id, memId));
      break;
    }

    default:
      logger.info(`Unhandled Clerk webhook type: ${type}`);
  }
}

function normalizeRole(role?: string): "owner" | "admin" | "member" | "viewer" {
  if (!role) return "member";
  const r = role.toLowerCase();
  if (r.includes("owner")) return "owner";
  if (r.includes("admin")) return "admin";
  if (r.includes("viewer")) return "viewer";
  return "member";
}

async function ensurePersonalWorkspace(
  db: ReturnType<typeof createDbClient>,
  userId: string,
  displayName: string,
) {
  const existing = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  if (existing.length > 0) return;

  const slugBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const slug = `${slugBase || "workspace"}-${userId.slice(-6).toLowerCase()}`;

  await db.insert(workspaces).values({
    ownerId: userId,
    ownerType: "user",
    name: `${displayName.split("@")[0] || displayName} Workspace`,
    slug,
    plan: "free",
  });
}

async function ensureTeamWorkspace(
  db: ReturnType<typeof createDbClient>,
  orgId: string,
  orgName: string,
) {
  const existing = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, orgId))
    .limit(1);

  if (existing.length > 0) return;

  const slugBase = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const slug = `${slugBase || "team"}-${orgId.slice(-6).toLowerCase()}`;

  await db.insert(workspaces).values({
    ownerId: orgId,
    ownerType: "org",
    name: `${orgName} Team`,
    slug,
    plan: "free",
  });
}
