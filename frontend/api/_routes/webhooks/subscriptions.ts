import { and, desc, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../_lib/auth.js";
import { canAccessWorkspace } from "../../_lib/db-auth.js";
import { sendJson } from "../../_lib/sideby.js";
import { createDbClient } from "../../../src/db/index.js";
import { webhookSubscriptions, workspaces } from "../../../src/db/schema.js";
import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

const CreateSubscriptionSchema = z.object({
  url: z.string().trim().url("Must be a valid URL"),
  workspaceId: z.string().uuid().optional(),
  eventTypes: z.array(
    z.enum(["comparison.completed", "comparison.failed"])
  ).min(1, "At least one event type must be selected"),
});

function serializeSubscription(row: typeof webhookSubscriptions.$inferSelect) {
  return {
    id: row.id,
    url: row.url,
    eventTypes: row.eventTypes,
    active: row.active,
    workspaceId: row.workspaceId,
    secret: row.secret,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const rows = await db
        .select()
        .from(webhookSubscriptions)
        .where(
          or(
            eq(webhookSubscriptions.userId, auth.userId),
            auth.orgId ? eq(webhookSubscriptions.organizationId, auth.orgId) : undefined,
          ),
        )
        .orderBy(desc(webhookSubscriptions.createdAt))
        .limit(50);

      return sendJson(response, { subscriptions: rows.map(serializeSubscription) });
    }

    if (request.method === "POST") {
      const body = CreateSubscriptionSchema.parse(request.body || {});
      let orgId = auth.orgId || null;

      if (body.workspaceId) {
        const hasAccess = await canAccessWorkspace(db, auth.userId, body.workspaceId);
        if (!hasAccess) {
          return sendJson(response, { error: "Workspace not found." }, 404);
        }
        const [workspace] = await db
          .select({ ownerType: workspaces.ownerType, ownerId: workspaces.ownerId })
          .from(workspaces)
          .where(eq(workspaces.id, body.workspaceId))
          .limit(1);
        orgId = workspace?.ownerType === "org" ? workspace.ownerId : auth.orgId || null;
      }

      const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
      const [row] = await db
        .insert(webhookSubscriptions)
        .values({
          userId: auth.userId,
          organizationId: orgId,
          workspaceId: body.workspaceId || null,
          url: body.url,
          secret: secret,
          eventTypes: body.eventTypes,
          active: true,
        })
        .returning();

      return sendJson(response, { subscription: serializeSubscription(row) }, 201);
    }

    return sendJson(response, { error: "Method not allowed" }, 405);
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
    return sendJson(
      response,
      {
        error: error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid request body."
          : error instanceof Error ? error.message : "Unable to manage webhook subscriptions.",
      },
      status,
    );
  }
}
