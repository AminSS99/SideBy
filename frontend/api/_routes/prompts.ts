import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { canAccessWorkspace } from "../_lib/db-auth.js";
import { sendJson } from "../_lib/sideby.js";
import { createDbClient } from "../../src/db/index.js";
import { promptTemplates } from "../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

const PromptBodySchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  systemPrompt: z.string().trim().min(1).max(12000),
  userPromptTemplate: z.string().trim().max(12000).optional(),
  variablesSchema: z.record(z.unknown()).default({}),
  isDefault: z.boolean().default(false),
});

function serializePrompt(row: typeof promptTemplates.$inferSelect) {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description || "",
    systemPrompt: row.systemPrompt,
    userPromptTemplate: row.userPromptTemplate || "",
    variablesSchema: row.variablesSchema,
    isDefault: row.isDefault,
    createdBy: row.createdBy,
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
    const workspaceId = Array.isArray(request.query.workspaceId)
      ? request.query.workspaceId[0]
      : request.query.workspaceId;

    if (request.method === "GET") {
      if (workspaceId) {
        const hasAccess = await canAccessWorkspace(db, auth.userId, workspaceId);
        if (!hasAccess) return sendJson(response, { error: "Workspace not found." }, 404);
      }

      const rows = await db
        .select()
        .from(promptTemplates)
        .where(
          workspaceId
            ? eq(promptTemplates.workspaceId, workspaceId)
            : or(eq(promptTemplates.createdBy, auth.userId), auth.orgId ? eq(promptTemplates.organizationId, auth.orgId) : eq(promptTemplates.createdBy, auth.userId)),
        )
        .orderBy(desc(promptTemplates.updatedAt))
        .limit(100);

      return sendJson(response, { prompts: rows.map(serializePrompt) });
    }

    if (request.method === "POST" || request.method === "PUT") {
      const body = PromptBodySchema.parse(request.body || {});
      const orgId = auth.orgId || null;

      if (body.workspaceId) {
        const hasAccess = await canAccessWorkspace(db, auth.userId, body.workspaceId);
        if (!hasAccess) return sendJson(response, { error: "Workspace not found." }, 404);
      }

      if (request.method === "PUT") {
        if (!body.id) return sendJson(response, { error: "Prompt id is required." }, 400);
        const [row] = await db
          .update(promptTemplates)
          .set({
            workspaceId: body.workspaceId || null,
            organizationId: orgId,
            name: body.name,
            description: body.description || null,
            systemPrompt: body.systemPrompt,
            userPromptTemplate: body.userPromptTemplate || null,
            variablesSchema: body.variablesSchema,
            isDefault: body.isDefault,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(promptTemplates.id, body.id),
              or(
                eq(promptTemplates.createdBy, auth.userId),
                auth.orgId ? eq(promptTemplates.organizationId, auth.orgId) : eq(promptTemplates.createdBy, auth.userId),
              ),
            ),
          )
          .returning();

        if (!row) return sendJson(response, { error: "Prompt not found." }, 404);
        return sendJson(response, { prompt: serializePrompt(row) });
      }

      const [row] = await db
        .insert(promptTemplates)
        .values({
          workspaceId: body.workspaceId || null,
          organizationId: orgId,
          createdBy: auth.userId,
          name: body.name,
          description: body.description || null,
          systemPrompt: body.systemPrompt,
          userPromptTemplate: body.userPromptTemplate || null,
          variablesSchema: body.variablesSchema,
          isDefault: body.isDefault,
        })
        .returning();

      return sendJson(response, { prompt: serializePrompt(row) }, 201);
    }

    if (request.method === "DELETE") {
      const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
      if (!id) return sendJson(response, { error: "Prompt id is required." }, 400);

      const [row] = await db
        .delete(promptTemplates)
        .where(
          and(
            eq(promptTemplates.id, id),
            or(
              eq(promptTemplates.createdBy, auth.userId),
              auth.orgId ? eq(promptTemplates.organizationId, auth.orgId) : eq(promptTemplates.createdBy, auth.userId),
            ),
          ),
        )
        .returning();

      if (!row) return sendJson(response, { error: "Prompt not found." }, 404);
      return sendJson(response, { success: true });
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
          : error instanceof Error ? error.message : "Unable to manage prompts.",
      },
      status,
    );
  }
}
