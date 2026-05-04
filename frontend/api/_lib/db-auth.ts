/**
 * Drizzle authorization helpers for SideBy.
 * All queries must go through these guards.
 */
import { eq, and, or, inArray } from "drizzle-orm";
import type { DbClient } from "../../src/db/index";
import {
  workspaces,
  projects,
  comparisons,
  memberships,
  users,
} from "../../src/db/schema";

// ─── Workspace Access ───────────────────────────────────────────────────────

export async function getAccessibleWorkspaces(db: DbClient, userId: string) {
  // Personal workspaces
  const personal = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId));

  // Team workspaces via memberships
  const memberOrgs = await db
    .select({ orgId: memberships.organizationId })
    .from(memberships)
    .where(eq(memberships.userId, userId));

  const orgIds = memberOrgs.map((m) => m.orgId);

  const team =
    orgIds.length > 0
      ? await db
          .select()
          .from(workspaces)
          .where(inArray(workspaces.ownerId, orgIds))
      : [];

  return [...personal, ...team];
}

export async function canAccessWorkspace(
  db: DbClient,
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (ws.length === 0) return false;

  const workspace = ws[0];

  // Owns personal workspace
  if (workspace.ownerType === "user" && workspace.ownerId === userId) {
    return true;
  }

  // Is member of org workspace
  if (workspace.ownerType === "org") {
    const mem = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organizationId, workspace.ownerId),
        ),
      )
      .limit(1);
    return mem.length > 0;
  }

  return false;
}

// ─── Project Access ─────────────────────────────────────────────────────────

export async function canAccessProject(
  db: DbClient,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const proj = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (proj.length === 0) return false;

  return canAccessWorkspace(db, userId, proj[0].workspaceId);
}

// ─── Comparison Access ──────────────────────────────────────────────────────

export async function canAccessComparison(
  db: DbClient,
  userId: string | null,
  comparisonId: string,
): Promise<boolean> {
  const comp = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.id, comparisonId))
    .limit(1);

  if (comp.length === 0) return false;

  const c = comp[0];

  if (c.visibility === "public") return true;
  if (!userId) return false;

  // Owns the comparison directly
  if (c.clerkUserId === userId) return true;

  // Has access via workspace
  if (c.workspaceId) {
    return canAccessWorkspace(db, userId, c.workspaceId);
  }

  return false;
}

export async function canMutateComparison(
  db: DbClient,
  userId: string,
  comparisonId: string,
): Promise<boolean> {
  const comp = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.id, comparisonId))
    .limit(1);

  if (comp.length === 0) return false;

  const c = comp[0];

  // Owner can always mutate
  if (c.clerkUserId === userId) return true;

  // Workspace admin/owner can mutate
  if (c.workspaceId) {
    const ws = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, c.workspaceId))
      .limit(1);

    if (ws.length > 0) {
      const workspace = ws[0];

      if (workspace.ownerType === "user" && workspace.ownerId === userId) {
        return true;
      }

      if (workspace.ownerType === "org") {
        const mem = await db
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.userId, userId),
              eq(memberships.organizationId, workspace.ownerId),
            ),
          )
          .limit(1);

        if (mem.length > 0) {
          const role = mem[0].role;
          if (role === "owner" || role === "admin") return true;
        }
      }
    }
  }

  return false;
}

// ─── User Sync ──────────────────────────────────────────────────────────────

export async function upsertUser(
  db: DbClient,
  payload: {
    id: string;
    email?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  },
) {
  await db
    .insert(users)
    .values({
      id: payload.id,
      email: payload.email ?? null,
      name: payload.name ?? null,
      avatarUrl: payload.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: payload.email ?? null,
        name: payload.name ?? null,
        avatarUrl: payload.avatarUrl ?? null,
      },
    });
}
