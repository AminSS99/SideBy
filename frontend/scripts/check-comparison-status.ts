import "dotenv/config";
import { createDbClient } from "../src/db/index.js";
import { comparisons, aiRuns, aiRunSteps, comparisonSources } from "../src/db/schema.js";
import { desc, eq } from "drizzle-orm";

async function main() {
  const db = createDbClient();
  
  // Get latest comparison
  const [comp] = await db.select().from(comparisons).orderBy(desc(comparisons.createdAt)).limit(1);
  if (!comp) {
    console.log("No comparisons found.");
    return;
  }

  console.log("Latest Comparison Details:");
  console.log(JSON.stringify({
    id: comp.id,
    query: comp.query,
    status: comp.status,
    progress: comp.progress,
    activeStep: comp.activeStep,
    error: comp.errorMessage,
    createdAt: comp.createdAt,
    updatedAt: comp.updatedAt
  }, null, 2));

  // Get AI runs
  const runs = await db.select().from(aiRuns).where(eq(aiRuns.comparisonId, comp.id));
  console.log(`\nAI Runs (${runs.length}):`);
  console.log(JSON.stringify(runs.map(r => ({
    id: r.id,
    task: r.task,
    status: r.status,
    model: r.model,
    errorMessage: r.errorMessage
  })), null, 2));

  // Get steps
  const steps = await db.select().from(aiRunSteps)
    .innerJoin(aiRuns, eq(aiRunSteps.aiRunId, aiRuns.id))
    .where(eq(aiRuns.comparisonId, comp.id))
    .orderBy(desc(aiRunSteps.createdAt));
  console.log(`\nAI Run Steps (${steps.length}):`);
  console.log(JSON.stringify(steps.map(s => ({
    id: s.ai_run_steps.id,
    stepName: s.ai_run_steps.stepName,
    status: s.ai_run_steps.status,
    error: s.ai_run_steps.errorTrace,
    createdAt: s.ai_run_steps.createdAt
  })), null, 2));

  // Get sources
  const sources = await db.select().from(comparisonSources).where(eq(comparisonSources.comparisonId, comp.id));
  console.log(`\nComparison Sources (${sources.length}):`);
  console.log(JSON.stringify(sources.map(s => ({
    id: s.id,
    url: s.url,
    title: s.title,
    reliability: s.reliability
  })), null, 2));
}

main().catch(console.error);
