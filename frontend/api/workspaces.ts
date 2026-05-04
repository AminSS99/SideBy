/**
 * GET /api/workspaces — list workspaces the user can access
 * POST /api/workspaces — create a new workspace (admin/owner only for org)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { createDbClient } from "../../src/db/index";
import { getAccessibleWorkspaces, canAccessWorkspace } from "../_lib/db-auth";
import { workspaces } from "../../src/db/schema";
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
      const list = await getAccessibleWorkspaces(db, auth.userId);
      return response.status(200).json({ workspaces: list });
    }

    if (request.method === "POST") {
      const body = request.body as {
        name?: string;
        slug?: string;
        ownerType?: "user" | "org";
        ownerId?: string;
      };

      const name = body.name?.trim();
      if (!name) {
        return response.status(400).json({ error: "Workspace name is required." });
      }

      const slugBase = (body.slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

      const slug = `${slugBase}-${Date.now().toString(36)}`;

      // Default to personal workspace
      const ownerType = body.ownerType || "user";
      const ownerId = body.ownerId || auth.userId;

      // If creating an org workspace, verify membership
      if (ownerType === "org" && ownerId !== auth.userId) {
        const hasAccess = await canAccessWorkspace(db, auth.userId, ownerId);
        if (!hasAccess) {
          return response.status(403).json({ error: "Not authorized to create workspace for this organization." });
        }
      }

      const inserted = await db
        .insert(workspaces)
        .values({
          ownerId,
          ownerType,
          name,
          slug,
          plan: "free",
        })
        .returning();

      return response.status(201).json({ workspace: inserted[0] });
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
