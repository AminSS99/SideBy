import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { resolveSnapSolveWorkspaceSession } from "../_lib/snapsolve-core.js";
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
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await requireAuth(request);
    const body = EcosystemSessionBodySchema.parse(request.body || {});
    const session = await resolveSnapSolveWorkspaceSession({
      clerkUserId: auth.userId,
      email: body.email ?? null,
    });

    return response.status(200).json({ session });
  } catch {
    return response.status(200).json({ session: null });
  }
}
