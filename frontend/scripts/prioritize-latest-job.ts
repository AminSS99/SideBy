import "dotenv/config";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";
import { and, eq, ne, desc } from "drizzle-orm";

async function main() {
  const db = createDbClient();
  
  // Find the newest comparison
  const rows = await db.select({
    id: comparisons.id,
    query: comparisons.query
  }).from(comparisons).orderBy(desc(comparisons.createdAt)).limit(1);

  if (rows.length === 0) {
    console.log("No comparisons found.");
    return;
  }

  const latestId = rows[0].id;
  console.log(`Latest comparison is ${latestId}: "${rows[0].query}"`);

  // Update all other non-completed, non-failed comparisons to "failed"
  await db.update(comparisons).set({
    status: "failed",
    errorMessage: "Skipped in development queue cleanup.",
    updatedAt: new Date()
  }).where(
    and(
      ne(comparisons.id, latestId),
      ne(comparisons.status, "completed"),
      ne(comparisons.status, "failed")
    )
  );

  // Set the latest comparison to queued with an old updatedAt so it runs next
  await db.update(comparisons).set({
    status: "queued",
    updatedAt: new Date(0) // 1970-01-01
  }).where(eq(comparisons.id, latestId));

  console.log("Prioritized latest job and skipped all others.");
}

main().catch(console.error);
