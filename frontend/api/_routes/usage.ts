/**
 * GET /api/usage — daily usage status
 * GET /api/usage?type=quality — quality dashboard (Phase 10)
 */
import { eq, desc, and, sql } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { getMonthlyUsageStatus, getUsageStatus } from "../_lib/rate-limit.js";
import { sendJson } from "../_lib/sideby.js";
import { resolveSubscriptionState } from "../_lib/subscription.js";
import { createDbClient } from "../../src/db/index.js";
import {
  comparisons,
  queryAnalytics,
  aiRuns,
  feedback as feedbackTable,
} from "../../src/db/schema.js";
import { comparisonCache } from "../_lib/cache-layer.js";
import {
  getComparisonCategoryDefinition,
  type ComparisonCategory,
} from "../../src/lib/comparisonTaxonomy.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

function getPlatformAdminIds(): Set<string> {
  return new Set(
    (process.env.SIDEBY_PLATFORM_ADMIN_USER_IDS || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

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
      const isPlatformAdmin = getPlatformAdminIds().has(auth.userId);
      const isOrgAdmin =
        Boolean(auth.orgId) &&
        Boolean(auth.orgRole) &&
        ["org:admin", "admin", "owner"].includes(auth.orgRole ?? "");

      // Restrict global quality dashboard to explicit platform admins; org admins see only their active org.
      if (!isPlatformAdmin && !isOrgAdmin) {
        return sendJson(response, { error: "Admin access required." }, 403);
      }

      const scopedOrgId = isPlatformAdmin ? null : auth.orgId;
      const db = createDbClient();

      const [
        failedJobs,
        lowConfidence,
        highCost,
        categories,
        safetyLevels,
        taxonomyStatuses,
        policyNotes,
        vagueCountResult,
        totalCompletedResult,
        totalFailedResult,
        avgCostResult,
        feedbackSummary,
        totalReusedResult,
        totalQueriesResult,
        totalBlockedResult,
        providerSpend,
      ] = await Promise.all([
        db
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
          .where(
            scopedOrgId
              ? and(eq(comparisons.status, "failed"), eq(comparisons.clerkOrgId, scopedOrgId))
              : eq(comparisons.status, "failed"),
          )
          .orderBy(desc(comparisons.updatedAt))
          .limit(20),
        db
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
              ...(scopedOrgId ? [eq(comparisons.clerkOrgId, scopedOrgId)] : []),
            ),
          )
          .orderBy(desc(comparisons.updatedAt))
          .limit(20),
        db
          .select({
            id: comparisons.id,
            query: comparisons.query,
            slug: comparisons.slug,
            totalCost: comparisons.totalCost,
            updatedAt: comparisons.updatedAt,
          })
          .from(comparisons)
          .where(
            scopedOrgId
              ? and(sql`${comparisons.totalCost} IS NOT NULL`, eq(comparisons.clerkOrgId, scopedOrgId))
              : sql`${comparisons.totalCost} IS NOT NULL`,
          )
          .orderBy(desc(comparisons.totalCost))
          .limit(20),
        scopedOrgId
          ? db
              .select({
                category: queryAnalytics.queryCategory,
                status: queryAnalytics.taxonomyStatus,
                safetyLevel: queryAnalytics.safetyLevel,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${queryAnalytics.queryCategory} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
              .groupBy(queryAnalytics.queryCategory, queryAnalytics.taxonomyStatus, queryAnalytics.safetyLevel)
              .orderBy(desc(sql`count(*)`))
          : db
              .select({
                category: queryAnalytics.queryCategory,
                status: queryAnalytics.taxonomyStatus,
                safetyLevel: queryAnalytics.safetyLevel,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .where(sql`${queryAnalytics.queryCategory} IS NOT NULL`)
              .groupBy(queryAnalytics.queryCategory, queryAnalytics.taxonomyStatus, queryAnalytics.safetyLevel)
              .orderBy(desc(sql`count(*)`)),
        scopedOrgId
          ? db
              .select({
                safetyLevel: queryAnalytics.safetyLevel,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${queryAnalytics.safetyLevel} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
              .groupBy(queryAnalytics.safetyLevel)
              .orderBy(desc(sql`count(*)`))
          : db
              .select({
                safetyLevel: queryAnalytics.safetyLevel,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .where(sql`${queryAnalytics.safetyLevel} IS NOT NULL`)
              .groupBy(queryAnalytics.safetyLevel)
              .orderBy(desc(sql`count(*)`)),
        scopedOrgId
          ? db
              .select({
                status: queryAnalytics.taxonomyStatus,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${queryAnalytics.taxonomyStatus} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
              .groupBy(queryAnalytics.taxonomyStatus)
              .orderBy(desc(sql`count(*)`))
          : db
              .select({
                status: queryAnalytics.taxonomyStatus,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .where(sql`${queryAnalytics.taxonomyStatus} IS NOT NULL`)
              .groupBy(queryAnalytics.taxonomyStatus)
              .orderBy(desc(sql`count(*)`)),
        scopedOrgId
          ? db
              .select({
                note: queryAnalytics.policyNote,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${queryAnalytics.policyNote} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
              .groupBy(queryAnalytics.policyNote)
              .orderBy(desc(sql`count(*)`))
              .limit(20)
          : db
              .select({
                note: queryAnalytics.policyNote,
                count: sql<number>`count(*)::integer`,
              })
              .from(queryAnalytics)
              .where(sql`${queryAnalytics.policyNote} IS NOT NULL`)
              .groupBy(queryAnalytics.policyNote)
              .orderBy(desc(sql`count(*)`))
              .limit(20),
        scopedOrgId
          ? db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(and(eq(queryAnalytics.isVague, true), eq(comparisons.clerkOrgId, scopedOrgId)))
          : db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .where(eq(queryAnalytics.isVague, true)),
        db
          .select({ count: sql<number>`count(*)::integer` })
          .from(comparisons)
          .where(
            scopedOrgId
              ? and(eq(comparisons.status, "completed"), eq(comparisons.clerkOrgId, scopedOrgId))
              : eq(comparisons.status, "completed"),
          ),
        db
          .select({ count: sql<number>`count(*)::integer` })
          .from(comparisons)
          .where(
            scopedOrgId
              ? and(eq(comparisons.status, "failed"), eq(comparisons.clerkOrgId, scopedOrgId))
              : eq(comparisons.status, "failed"),
          ),
        db
          .select({ avg: sql<number>`avg(${comparisons.totalCost})::float` })
          .from(comparisons)
          .where(
            scopedOrgId
              ? and(sql`${comparisons.totalCost} IS NOT NULL`, eq(comparisons.clerkOrgId, scopedOrgId))
              : sql`${comparisons.totalCost} IS NOT NULL`,
          ),
        scopedOrgId
          ? db
              .select({
                rating: feedbackTable.rating,
                count: sql<number>`count(*)::integer`,
              })
              .from(feedbackTable)
              .innerJoin(comparisons, eq(feedbackTable.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${feedbackTable.rating} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
              .groupBy(feedbackTable.rating)
              .orderBy(feedbackTable.rating)
          : db
              .select({
                rating: feedbackTable.rating,
                count: sql<number>`count(*)::integer`,
              })
              .from(feedbackTable)
              .where(sql`${feedbackTable.rating} IS NOT NULL`)
              .groupBy(feedbackTable.rating)
              .orderBy(feedbackTable.rating),
        scopedOrgId
          ? db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${queryAnalytics.reusedFromId} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
          : db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .where(sql`${queryAnalytics.reusedFromId} IS NOT NULL`),
        scopedOrgId
          ? db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(eq(comparisons.clerkOrgId, scopedOrgId))
          : db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics),
        scopedOrgId
          ? db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .innerJoin(comparisons, eq(queryAnalytics.comparisonId, comparisons.id))
              .where(
                and(
                  sql`(${queryAnalytics.safetyLevel} = 'blocked' OR ${queryAnalytics.taxonomyStatus} IN ('sensitive', 'unsupported'))`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
          : db
              .select({ count: sql<number>`count(*)::integer` })
              .from(queryAnalytics)
              .where(sql`${queryAnalytics.safetyLevel} = 'blocked' OR ${queryAnalytics.taxonomyStatus} IN ('sensitive', 'unsupported')`),
        scopedOrgId
          ? db
              .select({
                provider: aiRuns.provider,
                totalCost: sql<number>`sum(${aiRuns.estimatedCost})::float`,
                callCount: sql<number>`count(*)::integer`,
              })
              .from(aiRuns)
              .innerJoin(comparisons, eq(aiRuns.comparisonId, comparisons.id))
              .where(
                and(
                  sql`${aiRuns.estimatedCost} IS NOT NULL`,
                  eq(comparisons.clerkOrgId, scopedOrgId),
                ),
              )
              .groupBy(aiRuns.provider)
              .orderBy(desc(sql`sum(${aiRuns.estimatedCost})`))
          : db
              .select({
                provider: aiRuns.provider,
                totalCost: sql<number>`sum(${aiRuns.estimatedCost})::float`,
                callCount: sql<number>`count(*)::integer`,
              })
              .from(aiRuns)
              .where(sql`${aiRuns.estimatedCost} IS NOT NULL`)
              .groupBy(aiRuns.provider)
              .orderBy(desc(sql`sum(${aiRuns.estimatedCost})`)),
      ]);

      const vagueCount = vagueCountResult[0];
      const totalCompleted = totalCompletedResult[0];
      const totalFailed = totalFailedResult[0];
      const avgCost = avgCostResult[0];
      const totalReused = totalReusedResult[0];
      const totalQueries = totalQueriesResult[0];
      const totalBlocked = totalBlockedResult[0];

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
          memorySize: isPlatformAdmin ? comparisonCache.size() : 0,
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

    const subscription = await resolveSubscriptionState({
      userId: auth.userId,
      orgId: auth.orgId,
      feature: "comparison",
    });
    const status = await getUsageStatus("user", auth.userId, subscription.plan);
    const monthly = await getMonthlyUsageStatus(auth.userId, subscription.plan);

    return sendJson(response, {
      plan: subscription.plan,
      limits: subscription.limits,
      usage: status,
      monthly,
      billingConfigured: subscription.billingConfigured,
      subscription: {
        source: subscription.source,
        status: subscription.status,
        billingProvider: subscription.billingProvider,
        entitlement: subscription.entitlement,
        snapsolveWorkspace: subscription.snapsolveWorkspace,
      },
      message: subscription.message,
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
