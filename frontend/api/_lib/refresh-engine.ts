/**
 * Comparison Refresh Engine
 * Queues comparison re-runs in the background.
 */
import { eq } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import { comparisons } from "../../src/db/schema.js";
import { canMutateComparison } from "./db-auth.js";

export async function queueComparisonRefresh(
  comparisonId: string,
  userId: string,
) {
  const db = createDbClient();

  const canMutate = await canMutateComparison(db, userId, comparisonId);
  if (!canMutate) {
    throw new Error("Not authorized to refresh this comparison.");
  }

  const [comp] = await db
    .select({ id: comparisons.id, status: comparisons.status })
    .from(comparisons)
    .where(eq(comparisons.id, comparisonId))
    .limit(1);

  if (!comp) {
    throw new Error("Comparison not found.");
  }

  await db
    .update(comparisons)
    .set({
      status: "queued",
      progress: 0,
      activeStep: 0,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(comparisons.id, comparisonId));

  return {
    comparisonId,
    status: "queued",
    message: "Refresh queued. The comparison will update in the background.",
  };
}
