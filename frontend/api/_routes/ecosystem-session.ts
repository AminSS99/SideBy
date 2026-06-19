import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { resolveSnapSolveWorkspaceSession } from "../_lib/snapsolve-core.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = await requireAuth(request);
    const body = request.body as { email?: string | null } | undefined;
    const session = await resolveSnapSolveWorkspaceSession({
      clerkUserId: auth.userId,
      email: typeof body?.email === "string" ? body.email : null,
    });

    return response.status(200).json({ session });
  } catch {
    return response.status(200).json({ session: null });
  }
}
