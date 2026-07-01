/**
 * Consolidated workspace/project API for Hobby-plan function limits.
 * Rewrites preserve /api/workspaces and /api/projects.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { requireAuth } from "../_lib/auth.js";
import { canAccessWorkspace, getAccessibleWorkspaces } from "../_lib/db-auth.js";
import { createOrLinkSnapSolveWorkspace } from "../_lib/snapsolve-core.js";
import { logger } from "../_lib/log.js";
import { createDbClient } from "../../src/db/index.js";
import { projects, users, workspaces } from "../../src/db/schema.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

function setCorsHeaders(res: VercelResponse, req: VercelRequest) {
  const origin = getSingleHeader(req.headers.origin);
  const requestHost = getSingleHeader(req.headers["x-forwarded-host"]) || getSingleHeader(req.headers.host);
  const allowedOrigins = getAllowedOrigins(requestHost);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-SideBy-CSRF");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function getSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAllowedOrigins(requestHost?: string) {
  const origins = new Set<string>();
  const appUrl = process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    origins.add(appUrl.replace(/\/+$/, ""));
  }

  if (requestHost) {
    origins.add(`https://${requestHost}`);
    if (process.env.NODE_ENV !== "production") {
      origins.add(`http://${requestHost}`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }

  return origins;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  setCorsHeaders(response, request);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  const resource = getQueryValue(request.query.resource);

  if (resource === "projects") {
    return handleProjects(request, response);
  }

  if (resource === "workspaces") {
    return handleWorkspaces(request, response);
  }

  return response.status(404).json({ error: "Unknown workspace resource." });
}

async function handleProjects(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const workspaceId = getQueryValue(request.query.workspaceId);

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
    return response.status(getErrorStatus(error)).json({
      error: error instanceof Error ? error.message : "Internal server error.",
    });
  }
}

async function handleWorkspaces(
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
      const ownerType = body.ownerType || "user";
      const ownerId = body.ownerId || auth.userId;

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

      const workspace = inserted[0];
      try {
        const [user] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, auth.userId))
          .limit(1);

        const snapSolveWorkspace = await createOrLinkSnapSolveWorkspace({
          clerkUserId: auth.userId,
          email: user?.email ?? null,
          externalOwnerId: ownerId,
          externalWorkspaceId: workspace.id,
          workspaceName: name,
          metadata: {
            local_workspace_slug: slug,
            owner_type: ownerType,
          },
        });

        if (snapSolveWorkspace) {
          const [syncedWorkspace] = await db
            .update(workspaces)
            .set({
              snapsolveWorkspaceId: snapSolveWorkspace.workspace_id,
              snapsolveWorkspaceSlug: snapSolveWorkspace.workspace_slug ?? null,
              snapsolveWorkspaceStatus: snapSolveWorkspace.status,
              snapsolveSyncError: snapSolveWorkspace.reason ?? null,
              updatedAt: new Date(),
            })
            .where(eq(workspaces.id, workspace.id))
            .returning();

          return response.status(201).json({ workspace: syncedWorkspace });
        }

        const [pendingWorkspace] = await db
          .update(workspaces)
          .set({
            snapsolveWorkspaceStatus: "sync_unavailable",
            snapsolveSyncError: "SnapSolve Core is not configured or did not accept the workspace link.",
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, workspace.id))
          .returning();

        return response.status(201).json({ workspace: pendingWorkspace });
      } catch (error) {
        logger.warn("SideBy workspace created without SnapSolve workspace link", {
          error: error instanceof Error ? error.message : String(error),
          userId: auth.userId,
          workspaceId: workspace.id,
        });
      }

      return response.status(201).json({ workspace: inserted[0] });
    }

    if (request.method === "PATCH") {
      const body = request.body as {
        workspaceId?: string;
        name?: string;
        slug?: string;
      };

      if (!body.workspaceId) {
        return response.status(400).json({ error: "workspaceId is required." });
      }

      const hasAccess = await canAccessWorkspace(db, auth.userId, body.workspaceId);
      if (!hasAccess) {
        return response.status(403).json({ error: "Not authorized to update this workspace." });
      }

      const name = body.name?.trim();
      const slug = body.slug
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);

      const [workspace] = await db
        .update(workspaces)
        .set({
          ...(name ? { name } : {}),
          ...(slug ? { slug } : {}),
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, body.workspaceId))
        .returning();

      return response.status(200).json({ workspace });
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(getErrorStatus(error)).json({
      error: error instanceof Error ? error.message : "Internal server error.",
    });
  }
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorStatus(error: unknown) {
  if (error instanceof Error && "statusCode" in error) {
    return (error as Error & { statusCode: number }).statusCode;
  }
  return 500;
}
