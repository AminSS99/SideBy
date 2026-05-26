import { createDbClient } from "../src/db/index.js";
import { users, workspaces, projects } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const db = createDbClient();
  console.log("Seeding mock user user_test_mock...");

  // Insert mock user
  await db.insert(users).values({
    id: "user_test_mock",
    email: "test@example.com",
    name: "Test Admin",
    avatarUrl: null,
  }).onConflictDoNothing();

  // Create default workspace if none exists
  const existingWorkspaces = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, "user_test_mock"))
    .limit(1);

  let workspaceId = existingWorkspaces[0]?.id;
  if (!workspaceId) {
    const ws = await db.insert(workspaces).values({
      ownerId: "user_test_mock",
      ownerType: "user",
      name: "Default Workspace",
      slug: "default-workspace-mock",
      plan: "free",
    }).returning({ id: workspaces.id });
    workspaceId = ws[0].id;
    console.log(`Created default workspace: ${workspaceId}`);
  }

  // Create default project if none exists
  const existingProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .limit(1);

  if (existingProjects.length === 0) {
    const proj = await db.insert(projects).values({
      workspaceId,
      createdBy: "user_test_mock",
      name: "Default Project",
      description: "Default E2E testing project",
    }).returning({ id: projects.id });
    console.log(`Created default project: ${proj[0].id}`);
  }

  console.log("Mock user seeding complete!");
  process.exit(0);
}

main().catch(console.error);
