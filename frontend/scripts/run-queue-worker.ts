import "dotenv/config";
import { drainQueuedComparisonJobs } from "../api/_lib/job-engine.js";

async function main() {
  console.log("🚀 Starting SideBy Local Queue Worker...");
  console.log("Listening for queued comparisons in Neon Database...");
  
  while (true) {
    try {
      // Pass undefined for scheduleJob so it awaits the comparison jobs synchronously in this worker process.
      // This prevents Vercel Dev's lambda context from suspending it, since this is a persistent node script.
      const result = await drainQueuedComparisonJobs(1);
      if (result.started > 0) {
        console.log(`[Queue Worker] Processed ${result.started} job(s)`);
      }
    } catch (e) {
      console.error("[Queue Worker Error]:", e);
    }
    // Poll every 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);
