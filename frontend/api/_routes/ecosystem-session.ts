import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { requireAuth } from "../_lib/auth.js";
import { resolveSnapSolveWorkspaceSession } from "../_lib/snapsolve-core.js";
import { sendJson } from "../_lib/sideby.js";
import { logger } from "../_lib/log.js";
import { createDbClient } from "../../src/db/index.js";
import { users } from "../../src/db/schema.js";
import { z } from "zod";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

// Accepted for backwards compatibility with existing clients, but NEVER trusted:
// email must be resolved server-side from the authenticated user record so a
// caller cannot spoof another user's email when signing into SnapSolve Core.
const EcosystemSessionBodySchema = z.object({
  email: z.string().email().max(254).nullable().optional(),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    EcosystemSessionBodySchema.parse(request.body || {});

    const db = createDbClient();
    const [dbUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const session = await resolveSnapSolveWorkspaceSession({
      clerkUserId: auth.userId,
      email: dbUser?.email ?? null,
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
