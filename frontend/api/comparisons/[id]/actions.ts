/**
 * POST /api/comparisons/:id/actions
 * Export or follow-up on a comparison.
 */
import { sendJson } from "../../_lib/sideby.js";
import { requireAuth } from "../../_lib/auth.js";
import { withRateLimit } from "../../_lib/route-guard.js";
import { exportComparison } from "../../_lib/export-engine.js";
import { answerFollowUp } from "../../_lib/followup-engine.js";
import { captureServerEvent } from "../../_lib/analytics.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id)
      ? request.query.id[0]
      : request.query.id;
    if (!id) {
      return sendJson(response, { error: "Comparison id is required." }, 400);
    }

    const body = request.body as { action?: "export" | "follow-up"; format?: "markdown" | "json"; question?: string };
    const action = body.action || "export";

    if (action === "follow-up") {
      const question = body.question?.trim();
      if (!question) {
        return sendJson(response, { error: "Question is required." }, 400);
      }

      return await withRateLimit(request, response, "followUp", async () => {
        const result = await answerFollowUp(id, auth.userId, question);
        captureServerEvent(auth.userId, "follow_up_asked", {
          comparison_id: id,
          question_length: question.length,
        });
        return sendJson(response, result);
      });
    }

    // Export
    return await withRateLimit(request, response, "export", async () => {
      const format = body.format || "markdown";
      const result = await exportComparison(id, auth.userId, format);
      captureServerEvent(auth.userId, "comparison_exported", {
        comparison_id: id,
        format,
      });

      if (format === "markdown" && "markdown" in result) {
        response.setHeader("Content-Type", "text/markdown");
        response.setHeader(
          "Content-Disposition",
          `attachment; filename="sideby-comparison-${id}.md"`,
        );
        return response.status(200).send(result.markdown);
      }

      return sendJson(response, result);
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to process action." },
      status,
    );
  }
}
