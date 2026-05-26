import "dotenv/config";
import { searchEntitySources } from "../api/_lib/search.js";

async function main() {
  console.log("Testing searchEntitySources...");
  const start = Date.now();
  const results = await searchEntitySources("React", "SaaS comparison", "developer_tool");
  console.log("Search completed!");
  console.log("Results count:", results.length);
  console.log("Results preview:", JSON.stringify(results.slice(0, 2), null, 2));
  console.log("Time taken (ms):", Date.now() - start);
}

main().catch(console.error);
