import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { requireApiKey } from "../../_lib/api-key-auth.js";
import { createComparisonJob, listComparisonHistory, sendJson } from "../../_lib/sideby.js";
import { assertNoLikelySecrets } from "../../_lib/secret-scan.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { withApiKeyRateLimit } from "../../_lib/route-guard.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

const CreateBodySchema = z.object({
  query: z.string().trim().min(1).max(800),
  workspaceId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const apiKey = await requireApiKey(request);
    if (!apiKey.userId) {
      return sendJson(response, { error: "API key is not linked to a user." }, 403);
    }

    if (request.method === "GET") {
      return sendJson(response, {
        comparisons: await listComparisonHistory(apiKey.userId, 50),
      });
    }

    if (request.method === "POST") {
      return withApiKeyRateLimit(request, response, "comparison", apiKey, async () => {
        const body = CreateBodySchema.parse(request.body || {});
        assertNoLikelySecrets(body.query);
        const job = await createComparisonJob({
          query: body.query,
          userId: apiKey.userId,
          orgId: apiKey.orgId || undefined,
          workspaceId: body.workspaceId || apiKey.workspaceId || undefined,
          projectId: body.projectId,
        }, waitUntil);

        return sendJson(response, job, 202);
      });
    }

    return sendJson(response, { error: "Method not allowed" }, 405);
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
    return sendJson(
      response,
      {
        error: error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid request body."
          : error instanceof Error ? error.message : "Unable to process API request.",
      },
      status,
    );
  }
}
