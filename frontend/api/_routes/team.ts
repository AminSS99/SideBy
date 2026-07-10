import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { canAccessWorkspace } from "../_lib/db-auth.js";
import { sendJson } from "../_lib/sideby.js";
import { createDbClient } from "../../src/db/index.js";
import { memberships, teamInvitations, users, workspaces } from "../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 20,
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

const InviteBodySchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().trim().email().max(320),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

const PatchBodySchema = z.object({
  workspaceId: z.string().uuid(),
  membershipId: z.string().min(1),
  role: z.enum(["admin", "member", "viewer"]),
});

const DeleteBodySchema = z.object({
  workspaceId: z.string().uuid(),
  membershipId: z.string().min(1),
});

async function resolveOrgWorkspace(
  db: ReturnType<typeof createDbClient>,
  userId: string,
  workspaceId: string,
) {
  const hasAccess = await canAccessWorkspace(db, userId, workspaceId);
  if (!hasAccess) {
    throw Object.assign(new Error("Workspace not found."), { statusCode: 404 });
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace || workspace.ownerType !== "org") {
    throw Object.assign(new Error("Team management requires an organization workspace."), {
      statusCode: 400,
    });
  }

  return workspace;
}

async function assertOrgAdmin(
  db: ReturnType<typeof createDbClient>,
  userId: string,
  organizationId: string,
) {
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .limit(1);

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw Object.assign(new Error("Admin access required."), { statusCode: 403 });
  }
}

function clerkRole(role: "admin" | "member" | "viewer") {
  return role === "admin" ? "org:admin" : "org:member";
}

async function createClerkInvitation(params: {
  organizationId: string;
  inviterUserId: string;
  email: string;
  role: "admin" | "member" | "viewer";
}) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw Object.assign(new Error("Clerk secret key is required to send invitations."), {
      statusCode: 503,
    });
  }

  const redirectUrl = process.env.CLERK_INVITATION_REDIRECT_URL || process.env.VITE_APP_URL;
  const response = await fetch(
    `https://api.clerk.com/v1/organizations/${params.organizationId}/invitations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviter_user_id: params.inviterUserId,
        email_address: params.email,
        role: clerkRole(params.role),
        ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
      }),
    },
  );

  if (!response.ok) {
    throw Object.assign(
      new Error(`Clerk invitation failed: ${response.status} ${await response.text()}`),
      { statusCode: 502 },
    );
  }

  return (await response.json()) as { id?: string };
}

async function updateClerkMembership(params: {
  organizationId: string;
  userId: string;
  role: "admin" | "member" | "viewer";
}) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw Object.assign(new Error("Clerk secret key is required."), { statusCode: 503 });
  }

  const response = await fetch(
    `https://api.clerk.com/v1/organizations/${params.organizationId}/memberships/${params.userId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: clerkRole(params.role) }),
    },
  );

  if (!response.ok) {
    throw Object.assign(
      new Error(`Clerk role update failed: ${response.status} ${await response.text()}`),
      { statusCode: 502 },
    );
  }

  return response.json();
}

async function removeClerkMember(params: {
  organizationId: string;
  userId: string;
}) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw Object.assign(new Error("Clerk secret key is required."), { statusCode: 503 });
  }

  const response = await fetch(
    `https://api.clerk.com/v1/organizations/${params.organizationId}/memberships/${params.userId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    throw Object.assign(
      new Error(`Clerk member removal failed: ${response.status} ${await response.text()}`),
      { statusCode: 502 },
    );
  }
}

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
      if (!workspaceId) return sendJson(response, { error: "workspaceId is required." }, 400);

      const workspace = await resolveOrgWorkspace(db, auth.userId, workspaceId);

      const memberRows = await db
        .select({
          id: memberships.id,
          userId: memberships.userId,
          role: memberships.role,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
          joinedAt: memberships.createdAt,
        })
        .from(memberships)
        .leftJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.organizationId, workspace.ownerId));

      const invitationRows = await db
        .select()
        .from(teamInvitations)
        .where(eq(teamInvitations.organizationId, workspace.ownerId))
        .orderBy(desc(teamInvitations.createdAt))
        .limit(50);

      return sendJson(response, {
        members: memberRows.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: member.name || member.email || "Member",
          email: member.email || "",
          role: member.role,
          status: "active",
          avatarUrl: member.avatarUrl,
          joinedAt: member.joinedAt.toISOString(),
        })),
        invitations: invitationRows.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          createdAt: invite.createdAt.toISOString(),
        })),
      });
    }

    if (request.method === "POST") {
      const body = InviteBodySchema.parse(request.body || {});
      const workspace = await resolveOrgWorkspace(db, auth.userId, body.workspaceId);
      await assertOrgAdmin(db, auth.userId, workspace.ownerId);

      const clerkInvite = await createClerkInvitation({
        organizationId: workspace.ownerId,
        inviterUserId: auth.userId,
        email: body.email,
        role: body.role,
      });

      const [invite] = await db
        .insert(teamInvitations)
        .values({
          organizationId: workspace.ownerId,
          workspaceId: workspace.id,
          email: body.email.toLowerCase(),
          role: body.role,
          status: "pending",
          clerkInvitationId: clerkInvite.id || null,
          invitedBy: auth.userId,
        })
        .returning();

      return sendJson(response, {
        invitation: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          createdAt: invite.createdAt.toISOString(),
        },
      }, 201);
    }

    if (request.method === "PATCH") {
      const body = PatchBodySchema.parse(request.body || {});
      const workspace = await resolveOrgWorkspace(db, auth.userId, body.workspaceId);
      await assertOrgAdmin(db, auth.userId, workspace.ownerId);

      const [targetMembership] = await db
        .select({ userId: memberships.userId, role: memberships.role })
        .from(memberships)
        .where(eq(memberships.id, body.membershipId))
        .limit(1);

      if (!targetMembership) {
        return sendJson(response, { error: "Membership not found." }, 404);
      }

      if (targetMembership.role === "owner") {
        return sendJson(response, { error: "Cannot change the owner's role." }, 403);
      }

      await updateClerkMembership({
        organizationId: workspace.ownerId,
        userId: targetMembership.userId,
        role: body.role,
      });

      await db
        .update(memberships)
        .set({ role: body.role, updatedAt: new Date() })
        .where(eq(memberships.id, body.membershipId));

      return sendJson(response, { success: true, role: body.role });
    }

    if (request.method === "DELETE") {
      const body = DeleteBodySchema.parse(request.body || {});
      const workspace = await resolveOrgWorkspace(db, auth.userId, body.workspaceId);
      await assertOrgAdmin(db, auth.userId, workspace.ownerId);

      const [targetMembership] = await db
        .select({ userId: memberships.userId, role: memberships.role })
        .from(memberships)
        .where(eq(memberships.id, body.membershipId))
        .limit(1);

      if (!targetMembership) {
        return sendJson(response, { error: "Membership not found." }, 404);
      }

      if (targetMembership.role === "owner") {
        return sendJson(response, { error: "Cannot remove the workspace owner." }, 403);
      }

      await removeClerkMember({
        organizationId: workspace.ownerId,
        userId: targetMembership.userId,
      });

      await db
        .delete(memberships)
        .where(eq(memberships.id, body.membershipId));

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
          : error instanceof Error ? error.message : "Unable to manage team.",
      },
      status,
    );
  }
}
