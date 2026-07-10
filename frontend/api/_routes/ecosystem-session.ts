import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { resolveSnapSolveWorkspaceSession } from "../_lib/snapsolve-core.js";
import { sendJson } from "../_lib/sideby.js";
import { logger } from "../_lib/log.js";
import { z } from "zod";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

const EcosystemSessionBodySchema = z.object({
  email: z.string().email().max(254).nullable().optional(),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const body = EcosystemSessionBodySchema.parse(request.body || {});
    const session = await resolveSnapSolveWorkspaceSession({
      clerkUserId: auth.userId,
      email: body.email ?? null,
    });

    return sendJson(response, { session });
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;

    if (status >= 500) {
      logger.error("Ecosystem session failed", error instanceof Error ? error : undefined);
    }

    return sendJson(response, {
      error: error instanceof z.ZodError
        ? error.errors[0]?.message || "Invalid request."
        : error instanceof Error ? error.message : "Unable to create session.",
    }, status);
  }
}
