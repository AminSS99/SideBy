import "dotenv/config";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";
import { ne } from "drizzle-orm";

async function main() {
  const db = createDbClient();
  const count = await db.update(comparisons).set({
    status: "queued",
    progress: 0,
    activeStep: 0,
    updatedAt: new Date()
  }).where(ne(comparisons.status, "completed"));
  console.log("Reset non-completed jobs in Neon Postgres successfully.");
}

main().catch(console.error);
