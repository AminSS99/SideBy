import "dotenv/config";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";
import { desc } from "drizzle-orm";

async function main() {
  const db = createDbClient();
  const rows = await db.select().from(comparisons).orderBy(desc(comparisons.createdAt)).limit(5);
  console.log("Latest Comparisons:");
  console.log(JSON.stringify(rows.map(r => ({
    id: r.id,
    query: r.query,
    status: r.status,
    progress: r.progress,
    activeStep: r.activeStep,
    error: r.errorMessage,
    updatedAt: r.updatedAt
  })), null, 2));
}

main().catch(console.error);
