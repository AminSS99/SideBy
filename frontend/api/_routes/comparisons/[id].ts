import { getComparisonJob, loadPublishEvidence, sendJson } from "../../_lib/sideby.js";
import { assessPublishEligibility } from "../../_lib/public-eligibility.js";
import { createDbClient } from "../../../src/db/index.js";
import { requireAuth } from "../../_lib/auth.js";
import { withRateLimit } from "../../_lib/route-guard.js";
import { feedback } from "../../../src/db/schema.js";
import { canAccessComparison } from "../../_lib/db-auth.js";
import { z } from "zod";
import { waitUntil } from "@vercel/functions";
import { drainQueuedComparisonJobs } from "../../_lib/job-engine.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
  api: {
    bodyParser: {
      sizeLimit: "512kb",
    },
  },
};

const FeedbackBodySchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  correction: z.string().trim().max(4000).optional(),
  sourceReport: z.string().trim().max(4000).optional(),
});

// Hobby-plan crons only run daily, so in-flight polls double as the watchdog:
// the drain only touches jobs that are queued-and-due or stale-running.
const RECOVERY_THROTTLE_MS = 30_000;
let lastRecoverySweep = 0;

function sweepStaleJobs() {
  const now = Date.now();
  if (now - lastRecoverySweep < RECOVERY_THROTTLE_MS) return;
  lastRecoverySweep = now;
  waitUntil(
    drainQueuedComparisonJobs(3, waitUntil).catch(() => undefined),
  );
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === "GET") {
    try {
      const auth = await requireAuth(request);
      const id = Array.isArray(request.query.id)
        ? request.query.id[0]
        : request.query.id;
      if (!id) {
        return sendJson(response, { error: "Comparison id is required." }, 400);
      }

      const job = await getComparisonJob(id, auth.userId);
      if (job.status === "running") sweepStaleJobs();
      // Authoritative classification from server-written evidence (never a
      // client claim) so the UI can explain publishability before acting.
      const db = createDbClient();
      return sendJson(response, {
        ...job,
        publishEligibility: assessPublishEligibility(
          job.result,
          await loadPublishEvidence(db, id),
        ),
      });
    } catch (error) {
      const status =
        error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
      return sendJson(
        response,
        { error: error instanceof Error ? error.message : "Unable to load comparison." },
        status,
      );
    }
  }

  if (request.method === "POST") {
    // Feedback submission
    return withRateLimit(request, response, "followUp", async () => {
      try {
        const auth = await requireAuth(request);
        const id = Array.isArray(request.query.id)
          ? request.query.id[0]
          : request.query.id;
        if (!id) {
          return sendJson(response, { error: "Comparison id is required." }, 400);
        }

        const body = FeedbackBodySchema.parse(request.body || {});

        const db = createDbClient();
        const hasAccess = await canAccessComparison(db, auth.userId, id);
        if (!hasAccess) {
          return sendJson(response, { error: "Comparison not found." }, 404);
        }

        await db.insert(feedback).values({
          comparisonId: id,
          clerkUserId: auth.userId,
          rating: body.rating ?? null,
          correction: body.correction ?? null,
          sourceReport: body.sourceReport ?? null,
        });

        return sendJson(response, { success: true });
      } catch (error) {
        const status = error instanceof z.ZodError ? 400 : 500;
        return sendJson(
          response,
          {
            error: error instanceof z.ZodError
              ? error.errors[0]?.message || "Invalid request body."
              : error instanceof Error ? error.message : "Unable to submit feedback.",
          },
          status,
        );
      }
    });
  }

  return sendJson(response, { error: "Method not allowed" }, 405);
}
