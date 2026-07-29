import { z } from "zod";
import { requireAuth } from "../../_lib/auth.js";
import { getClientIp } from "../../_lib/route-guard.js";
import { checkRateLimit } from "../../_lib/rate-limit.js";
import { assertRedisAvailable } from "../../_lib/redis.js";
import { sendJson } from "../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 20,
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

const CheckoutBodySchema = z.object({
  plan: z.enum(["pulse", "core", "orbit"]).optional(),
});

const SNAP_SOLVE_BILLING_URL = "https://snapsolve.ink/cockpit/#/subscription";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    await assertRedisAvailable();
    const ip = getClientIp(request);
    const burst = await checkRateLimit("user", auth.userId || ip || "unknown", "billing", 10);
    if (!burst.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((burst.resetAt - Date.now()) / 1000))));
      return sendJson(response, { error: "Too many checkout attempts. Please wait a moment." }, 429);
    }

    const body = CheckoutBodySchema.parse(request.body || {});

    return sendJson(response, {
      checkoutUrl: SNAP_SOLVE_BILLING_URL,
      billingProvider: "snapsolve",
      requestedPlan: body.plan ?? null,
    });
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
          ? error.errors[0]?.message || "Invalid checkout request."
          : error instanceof Error ? error.message : "Unable to create checkout.",
      },
      status,
    );
  }
}
