/**
 * GET /api/usage — daily usage status
 * GET /api/usage?type=quality — quality dashboard (Phase 10)
 */
import { eq, desc, and, sql } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth.js";
import { getUsageStatus } from "./_lib/rate-limit.js";
import { sendJson } from "./_lib/sideby.js";
import { createDbClient } from "../src/db/index.js";
import {
  comparisons,
  queryAnalytics,
  aiRuns,
  feedback as feedbackTable,
  organizations,
  subscriptions,
} from "../src/db/schema.js";
import { comparisonCache } from "./_lib/cache-layer.js";
import {
  getComparisonCategoryDefinition,
  type ComparisonCategory,
} from "../src/lib/comparisonTaxonomy.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);

    // Phase 10: Quality dashboard mode
    const queryType = Array.isArray(request.query.type)
      ? request.query.type[0]
      : request.query.type;

    if (queryType === "quality") {
      const db = createDbClient();

      const failedJobs = await db
        .select({
          id: comparisons.id,
          query: comparisons.query,
          slug: comparisons.slug,
          errorMessage: comparisons.errorMessage,
          retryCount: comparisons.retryCount,
          updatedAt: comparisons.updatedAt,
          totalCost: queryAnalytics.totalCost,
        })
        .from(comparisons)
        .leftJoin(queryAnalytics, eq(comparisons.id, queryAnalytics.comparisonId))
        .where(eq(comparisons.status, "failed"))
        .orderBy(desc(comparisons.updatedAt))
        .limit(20);

      const lowConfidence = await db
        .select({
          id: comparisons.id,
          query: comparisons.query,
          slug: comparisons.slug,
          overallConfidence: comparisons.overallConfidence,
          updatedAt: comparisons.updatedAt,
        })
        .from(comparisons)
        .where(
          and(
            eq(comparisons.status, "completed"),
            sql`${comparisons.overallConfidence} IS NOT NULL`,
            sql`${comparisons.overallConfidence}::numeric < 0.7`,
          ),
        )
        .orderBy(desc(comparisons.updatedAt))
        .limit(20);

      const highCost = await db
        .select({
          id: comparisons.id,
          query: comparisons.query,
          slug: comparisons.slug,
          totalCost: comparisons.totalCost,
          updatedAt: comparisons.updatedAt,
        })
        .from(comparisons)
        .where(sql`${comparisons.totalCost} IS NOT NULL`)
        .orderBy(desc(comparisons.totalCost))
        .limit(20);

      const categories = await db
        .select({
          category: queryAnalytics.queryCategory,
          status: queryAnalytics.taxonomyStatus,
          safetyLevel: queryAnalytics.safetyLevel,
          count: sql<number>`count(*)::integer`,
        })
        .from(queryAnalytics)
        .where(sql`${queryAnalytics.queryCategory} IS NOT NULL`)
        .groupBy(queryAnalytics.queryCategory, queryAnalytics.taxonomyStatus, queryAnalytics.safetyLevel)
        .orderBy(desc(sql`count(*)`));

      const safetyLevels = await db
        .select({
          safetyLevel: queryAnalytics.safetyLevel,
          count: sql<number>`count(*)::integer`,
        })
        .from(queryAnalytics)
        .where(sql`${queryAnalytics.safetyLevel} IS NOT NULL`)
        .groupBy(queryAnalytics.safetyLevel)
        .orderBy(desc(sql`count(*)`));

      const taxonomyStatuses = await db
        .select({
          status: queryAnalytics.taxonomyStatus,
          count: sql<number>`count(*)::integer`,
        })
        .from(queryAnalytics)
        .where(sql`${queryAnalytics.taxonomyStatus} IS NOT NULL`)
        .groupBy(queryAnalytics.taxonomyStatus)
        .orderBy(desc(sql`count(*)`));

      const policyNotes = await db
        .select({
          note: queryAnalytics.policyNote,
          count: sql<number>`count(*)::integer`,
        })
        .from(queryAnalytics)
        .where(sql`${queryAnalytics.policyNote} IS NOT NULL`)
        .groupBy(queryAnalytics.policyNote)
        .orderBy(desc(sql`count(*)`))
        .limit(20);

      const [vagueCount] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(queryAnalytics)
        .where(eq(queryAnalytics.isVague, true));

      const [totalCompleted] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(comparisons)
        .where(eq(comparisons.status, "completed"));

      const [totalFailed] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(comparisons)
        .where(eq(comparisons.status, "failed"));

      const [avgCost] = await db
        .select({ avg: sql<number>`avg(${comparisons.totalCost})::float` })
        .from(comparisons)
        .where(sql`${comparisons.totalCost} IS NOT NULL`);

      const feedbackSummary = await db
        .select({
          rating: feedbackTable.rating,
          count: sql<number>`count(*)::integer`,
        })
        .from(feedbackTable)
        .where(sql`${feedbackTable.rating} IS NOT NULL`)
        .groupBy(feedbackTable.rating)
        .orderBy(feedbackTable.rating);

      // Phase 12: Cache and provider stats
      const [totalReused] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(queryAnalytics)
        .where(sql`${queryAnalytics.reusedFromId} IS NOT NULL`);

      const [totalQueries] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(queryAnalytics);

      const [totalBlocked] = await db
        .select({ count: sql<number>`count(*)::integer` })
        .from(queryAnalytics)
        .where(sql`${queryAnalytics.safetyLevel} = 'blocked' OR ${queryAnalytics.taxonomyStatus} IN ('sensitive', 'unsupported')`);

      const providerSpend = await db
        .select({
          provider: aiRuns.provider,
          totalCost: sql<number>`sum(${aiRuns.estimatedCost})::float`,
          callCount: sql<number>`count(*)::integer`,
        })
        .from(aiRuns)
        .where(sql`${aiRuns.estimatedCost} IS NOT NULL`)
        .groupBy(aiRuns.provider)
        .orderBy(desc(sql`sum(${aiRuns.estimatedCost})`));

      return sendJson(response, {
        stats: {
          totalCompleted: totalCompleted?.count || 0,
          totalFailed: totalFailed?.count || 0,
          totalVague: vagueCount?.count || 0,
          totalBlocked: totalBlocked?.count || 0,
          avgCost: avgCost?.avg ? Math.round(avgCost.avg * 10000) / 10000 : null,
        },
        // Phase 12: Cache and reuse stats
        cache: {
          memorySize: comparisonCache.size(),
          totalQueries: totalQueries?.count || 0,
          reusedCount: totalReused?.count || 0,
          reuseRate: totalQueries?.count
            ? Math.round((totalReused?.count || 0) / totalQueries.count * 100)
            : 0,
        },
        providerSpend: providerSpend.map((p) => ({
          provider: p.provider,
          totalCost: p.totalCost ? Math.round(p.totalCost * 10000) / 10000 : 0,
          callCount: p.callCount,
          avgCostPerCall: p.totalCost && p.callCount
            ? Math.round((p.totalCost / p.callCount) * 100000) / 100000
            : 0,
        })),
        failedJobs: failedJobs.map((j) => ({
          id: j.id,
          query: j.query,
          slug: j.slug,
          error: j.errorMessage,
          retryCount: j.retryCount,
          cost: j.totalCost ? Number(j.totalCost) : null,
          updatedAt: j.updatedAt?.toISOString(),
        })),
        lowConfidence: lowConfidence.map((j) => ({
          id: j.id,
          query: j.query,
          slug: j.slug,
          confidence: j.overallConfidence ? Number(j.overallConfidence) : null,
          updatedAt: j.updatedAt?.toISOString(),
        })),
        highCost: highCost.map((j) => ({
          id: j.id,
          query: j.query,
          slug: j.slug,
          cost: j.totalCost ? Number(j.totalCost) : null,
          updatedAt: j.updatedAt?.toISOString(),
        })),
        categories: categories.map((c) => ({
          category: c.category,
          label: c.category ? getComparisonCategoryDefinition(c.category as ComparisonCategory).label : "Unknown",
          status: c.status,
          safetyLevel: c.safetyLevel,
          count: c.count,
        })),
        taxonomy: {
          safetyLevels: safetyLevels.map((item) => ({
            safetyLevel: item.safetyLevel,
            count: item.count,
          })),
          statuses: taxonomyStatuses.map((item) => ({
            status: item.status,
            count: item.count,
          })),
          policyNotes: policyNotes.map((item) => ({
            note: item.note,
            count: item.count,
          })),
        },
        feedback: feedbackSummary.map((f) => ({
          rating: f.rating,
          count: f.count,
        })),
      });
    }

    // Standard usage endpoint
    const db = createDbClient();
    const [org] = auth.orgId
      ? await db
          .select({ plan: organizations.plan })
          .from(organizations)
          .where(eq(organizations.id, auth.orgId))
          .limit(1)
      : [];
    const [activeSubscription] = await db
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(
        and(
          sql`${subscriptions.status} in ('active', 'trialing')`,
          auth.orgId
            ? sql`(${subscriptions.organizationId} = ${auth.orgId} OR ${subscriptions.userId} = ${auth.userId})`
            : eq(subscriptions.userId, auth.userId),
        ),
      )
      .limit(1);

    const plan = org?.plan && org.plan !== "free"
      ? org.plan
      : activeSubscription
        ? "pro"
        : "free";
    const status = await getUsageStatus("user", auth.userId);
    const isUnlimited = plan !== "free";

    return sendJson(response, {
      plan,
      limits: {
        comparisonsPerDay: isUnlimited ? Number.MAX_SAFE_INTEGER : Number(process.env.FREE_COMPARISONS_PER_DAY || "5"),
        followUpsPerDay: isUnlimited ? Number.MAX_SAFE_INTEGER : Number(process.env.FREE_FOLLOWUPS_PER_DAY || "10"),
        refreshesPerDay: isUnlimited ? Number.MAX_SAFE_INTEGER : Number(process.env.FREE_REFRESHES_PER_DAY || "3"),
        exportsPerDay: isUnlimited ? Number.MAX_SAFE_INTEGER : Number(process.env.FREE_EXPORTS_PER_DAY || "10"),
      },
      usage: status,
      billingConfigured: Boolean(process.env.PADDLE_API_KEY),
      message: isUnlimited ? "Your paid plan is active." : "You are on the free plan.",
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load usage." },
      status,
    );
  }
}
