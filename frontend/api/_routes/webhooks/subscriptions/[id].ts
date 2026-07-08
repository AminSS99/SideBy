import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../_lib/auth.js";
import { sendJson } from "../../../_lib/sideby.js";
import { assertSafeWebhookUrl } from "../../../_lib/webhook-url.js";
import { createDbClient } from "../../../../src/db/index.js";
import { webhookSubscriptions } from "../../../../src/db/schema.js";
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

const UpdateSubscriptionSchema = z.object({
  url: z.string().trim().url().optional(),
  eventTypes: z.array(
    z.enum(["comparison.completed", "comparison.failed"])
  ).min(1).optional(),
  active: z.boolean().optional(),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "DELETE" && request.method !== "PATCH") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) {
      return sendJson(response, { error: "Subscription id is required." }, 400);
    }

    const db = createDbClient();

    // Verify ownership first
    const [sub] = await db
      .select()
      .from(webhookSubscriptions)
      .where(
        and(
          eq(webhookSubscriptions.id, id),
          or(
            eq(webhookSubscriptions.userId, auth.userId),
            auth.orgId ? eq(webhookSubscriptions.organizationId, auth.orgId) : undefined,
          ),
        ),
      )
      .limit(1);

    if (!sub) {
      return sendJson(response, { error: "Subscription not found." }, 404);
    }

    if (request.method === "DELETE") {
      await db
        .delete(webhookSubscriptions)
        .where(eq(webhookSubscriptions.id, id));

      return sendJson(response, { success: true });
    }

    if (request.method === "PATCH") {
      const body = UpdateSubscriptionSchema.parse(request.body || {});
      const updateData: Partial<typeof webhookSubscriptions.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (body.url !== undefined) {
        assertSafeWebhookUrl(body.url);
        updateData.url = body.url;
      }
      if (body.eventTypes !== undefined) updateData.eventTypes = body.eventTypes;
      if (body.active !== undefined) updateData.active = body.active;

      const [row] = await db
        .update(webhookSubscriptions)
        .set(updateData)
        .where(eq(webhookSubscriptions.id, id))
        .returning();

      return sendJson(response, {
        subscription: {
          id: row.id,
          url: row.url,
          eventTypes: row.eventTypes,
          active: row.active,
          workspaceId: row.workspaceId,
          secret: null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        },
      });
    }
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
          : error instanceof Error ? error.message : "Unable to manage subscription.",
      },
      status,
    );
  }
}
