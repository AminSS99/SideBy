import "dotenv/config";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";
import { desc } from "drizzle-orm";

async function main() {
  const db = createDbClient();
  const rows = await db.select({
    id: comparisons.id,
    query: comparisons.query,
    status: comparisons.status,
    progress: comparisons.progress,
    updatedAt: comparisons.updatedAt,
    createdAt: comparisons.createdAt
  }).from(comparisons).orderBy(desc(comparisons.updatedAt)).limit(20);

  console.log("All comparisons sorted by updatedAt desc:");
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(console.error);
