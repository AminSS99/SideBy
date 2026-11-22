import { and, desc, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { canAccessWorkspace, canAdminWorkspace } from "../_lib/db-auth.js";
import { createApiKeySecret } from "../_lib/api-key-auth.js";
import { sendJson } from "../_lib/sideby.js";
import { createDbClient } from "../../src/db/index.js";
import { apiKeys, workspaces } from "../../src/db/schema.js";
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

const MAX_ACTIVE_API_KEYS = 20;

const ALLOWED_API_KEY_SCOPES = [
  "comparisons:read",
  "comparisons:write",
  "comparisons:export",
  "comparisons:followups",
] as const;

const CreateApiKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  workspaceId: z.string().uuid().optional(),
  scopes: z.array(z.enum(ALLOWED_API_KEY_SCOPES)).min(1).max(ALLOWED_API_KEY_SCOPES.length).default([
    "comparisons:read",
    "comparisons:write",
    "comparisons:export",
    "comparisons:followups",
  ]),
});

function serializeKey(row: typeof apiKeys.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    prefix: `${row.keyPrefix}_...`,
    scopes: row.scopes,
    workspaceId: row.workspaceId,
    lastUsedAt: row.lastUsedAt?.toISOString() || null,
    revokedAt: row.revokedAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
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
        .from(apiKeys)
        .where(
          and(
            isNull(apiKeys.revokedAt),
            or(
              eq(apiKeys.userId, auth.userId),
              auth.orgId ? eq(apiKeys.organizationId, auth.orgId) : eq(apiKeys.userId, auth.userId),
            ),
          ),
        )
        .orderBy(desc(apiKeys.createdAt))
        .limit(50);

      return sendJson(response, { keys: rows.map(serializeKey) });
    }

    if (request.method === "POST") {
      const body = CreateApiKeySchema.parse(request.body || {});
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
        // Never leak a personal workspace API key into an active org scope.
        orgId = workspace?.ownerType === "org" ? workspace.ownerId : null;
        if (workspace?.ownerType === "org") {
          const isAdmin = await canAdminWorkspace(db, auth.userId, body.workspaceId, auth.orgId, auth.orgRole);
          if (!isAdmin) {
            return sendJson(
              response,
              { error: "Only workspace admins can create organization API keys." },
              403,
            );
          }
        }
      } else if (orgId && !["org:admin", "admin", "owner"].includes(auth.orgRole ?? "")) {
        // Non-admin org members default to personal keys, not org-wide keys.
        orgId = null;
      }

      const activeKeys = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(
          and(
            isNull(apiKeys.revokedAt),
            or(
              eq(apiKeys.userId, auth.userId),
              orgId ? eq(apiKeys.organizationId, orgId) : eq(apiKeys.userId, auth.userId),
            ),
          ),
        )
        .limit(MAX_ACTIVE_API_KEYS);

      if (activeKeys.length >= MAX_ACTIVE_API_KEYS) {
        return sendJson(
          response,
          { error: `Maximum of ${MAX_ACTIVE_API_KEYS} active API keys reached. Revoke an unused key first.` },
          400,
        );
      }

      const generated = createApiKeySecret();
      const [row] = await db
        .insert(apiKeys)
        .values({
          userId: auth.userId,
          organizationId: orgId,
          workspaceId: body.workspaceId || null,
          name: body.name,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          scopes: body.scopes,
        })
        .returning();

      return sendJson(response, { key: serializeKey(row), secret: generated.key }, 201);
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
          : status < 500 && error instanceof Error ? error.message : "Unable to manage API keys.",
      },
      status,
    );
  }
}
