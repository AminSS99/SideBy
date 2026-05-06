/**
 * GET /api/projects?workspaceId=... — list projects in workspace
 * POST /api/projects — create project in workspace
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth.js";
import { createDbClient } from "../src/db/index.js";
import { canAccessWorkspace } from "./_lib/db-auth.js";
import { projects } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const workspaceId = Array.isArray(request.query.workspaceId)
        ? request.query.workspaceId[0]
        : request.query.workspaceId;

      if (!workspaceId) {
        return response.status(400).json({ error: "workspaceId query parameter is required." });
      }

      const hasAccess = await canAccessWorkspace(db, auth.userId, workspaceId);
      if (!hasAccess) {
        return response.status(403).json({ error: "Not authorized to access this workspace." });
      }

      const list = await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId))
        .orderBy(projects.createdAt);

      return response.status(200).json({ projects: list });
    }

    if (request.method === "POST") {
      const body = request.body as {
        workspaceId?: string;
        name?: string;
        description?: string;
      };

      if (!body.workspaceId) {
        return response.status(400).json({ error: "workspaceId is required." });
      }
      if (!body.name?.trim()) {
        return response.status(400).json({ error: "Project name is required." });
      }

      const hasAccess = await canAccessWorkspace(db, auth.userId, body.workspaceId);
      if (!hasAccess) {
        return response.status(403).json({ error: "Not authorized to create projects in this workspace." });
      }

      const inserted = await db
        .insert(projects)
        .values({
          workspaceId: body.workspaceId,
          createdBy: auth.userId,
          name: body.name.trim(),
          description: body.description?.trim() || null,
        })
        .returning();

      return response.status(201).json({ project: inserted[0] });
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return response.status(status).json({
      error: error instanceof Error ? error.message : "Internal server error.",
    });
  }
}
