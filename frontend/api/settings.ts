import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "./_lib/auth.js";
import { canAccessWorkspace } from "./_lib/db-auth.js";
import { sendJson } from "./_lib/sideby.js";
import { createDbClient } from "../src/db/index.js";
import { userSettings, workspaceSettings } from "../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "512kb",
    },
  },
};

const SettingsBodySchema = z.object({
  workspaceId: z.string().uuid().optional(),
  preferences: z.record(z.unknown()).optional(),
  notificationPrefs: z.record(z.unknown()).optional(),
  defaultAiModel: z.string().trim().max(120).nullable().optional(),
  branding: z.record(z.unknown()).optional(),
  defaultDimensions: z.array(z.unknown()).max(50).optional(),
  defaultVisibility: z.enum(["private", "team", "public"]).optional(),
  sharedKnowledgeBase: z.boolean().optional(),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();
    const workspaceId = Array.isArray(request.query.workspaceId)
      ? request.query.workspaceId[0]
      : request.query.workspaceId;

    if (request.method === "GET") {
      const [userRow] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, auth.userId))
        .limit(1);

      let workspaceRow: typeof workspaceSettings.$inferSelect | null = null;
      if (workspaceId) {
        const hasAccess = await canAccessWorkspace(db, auth.userId, workspaceId);
        if (!hasAccess) return sendJson(response, { error: "Workspace not found." }, 404);
        [workspaceRow] = await db
          .select()
          .from(workspaceSettings)
          .where(eq(workspaceSettings.workspaceId, workspaceId))
          .limit(1);
      }

      return sendJson(response, {
        userSettings: userRow || null,
        workspaceSettings: workspaceRow || null,
      });
    }

    if (request.method === "POST") {
      const body = SettingsBodySchema.parse(request.body || {});

      const [savedUserSettings] = await db
        .insert(userSettings)
        .values({
          userId: auth.userId,
          preferences: body.preferences || {},
          notificationPrefs: body.notificationPrefs || {},
          defaultAiModel: body.defaultAiModel || null,
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            preferences: body.preferences || {},
            notificationPrefs: body.notificationPrefs || {},
            defaultAiModel: body.defaultAiModel || null,
            updatedAt: new Date(),
          },
        })
        .returning();

      let savedWorkspaceSettings: typeof workspaceSettings.$inferSelect | null = null;
      if (body.workspaceId) {
        const hasAccess = await canAccessWorkspace(db, auth.userId, body.workspaceId);
        if (!hasAccess) return sendJson(response, { error: "Workspace not found." }, 404);

        [savedWorkspaceSettings] = await db
          .insert(workspaceSettings)
          .values({
            workspaceId: body.workspaceId,
            branding: body.branding || {},
            defaultDimensions: body.defaultDimensions || [],
            notificationPrefs: body.notificationPrefs || {},
            defaultVisibility: body.defaultVisibility || "private",
            sharedKnowledgeBase: body.sharedKnowledgeBase ?? true,
            updatedBy: auth.userId,
          })
          .onConflictDoUpdate({
            target: workspaceSettings.workspaceId,
            set: {
              branding: body.branding || {},
              defaultDimensions: body.defaultDimensions || [],
              notificationPrefs: body.notificationPrefs || {},
              defaultVisibility: body.defaultVisibility || "private",
              sharedKnowledgeBase: body.sharedKnowledgeBase ?? true,
              updatedBy: auth.userId,
              updatedAt: new Date(),
            },
          })
          .returning();
      }

      return sendJson(response, {
        userSettings: savedUserSettings,
        workspaceSettings: savedWorkspaceSettings,
      });
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
          : error instanceof Error ? error.message : "Unable to save settings.",
      },
      status,
    );
  }
}
