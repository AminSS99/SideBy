/**
 * GET /api/usage
 * Returns current user's daily usage status.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { getUsageStatus } from "../_lib/rate-limit";
import { sendJson } from "../_lib/sideby";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
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
    const status = await getUsageStatus("user", auth.userId);

    return sendJson(response, {
      plan: "free",
      limits: {
        comparisonsPerDay: Number(process.env.FREE_COMPARISONS_PER_DAY || "5"),
        followUpsPerDay: Number(process.env.FREE_FOLLOWUPS_PER_DAY || "10"),
        refreshesPerDay: Number(process.env.FREE_REFRESHES_PER_DAY || "3"),
        exportsPerDay: Number(process.env.FREE_EXPORTS_PER_DAY || "10"),
      },
      usage: status,
      billingConfigured: false,
      message: "You are on the free plan. Paid plans coming soon.",
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
