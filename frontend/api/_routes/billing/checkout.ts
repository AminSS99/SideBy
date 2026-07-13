import { z } from "zod";
import { requireAuth } from "../../_lib/auth.js";
import { getClientIp } from "../../_lib/route-guard.js";
import { checkRateLimit } from "../../_lib/rate-limit.js";
import { assertRedisAvailable } from "../../_lib/redis.js";
import { dodoRequest, getDodoProductId } from "../../_lib/dodo.js";
import { sendJson } from "../../_lib/sideby.js";
import { createDbClient } from "../../../src/db/index.js";
import { users } from "../../../src/db/schema.js";
import { eq } from "drizzle-orm";
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
  plan: z.enum(["pro", "team", "enterprise"]),
  quantity: z.number().int().min(1).max(500).default(1),
});

type DodoCheckoutResponse = {
  session_id: string;
  checkout_url: string;
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
    await assertRedisAvailable();
    const ip = getClientIp(request);
    const burst = await checkRateLimit("user", auth.userId || ip || "unknown", "billing", 10);
    if (!burst.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((burst.resetAt - Date.now()) / 1000))));
      return sendJson(response, { error: "Too many checkout attempts. Please wait a moment." }, 429);
    }

    const body = CheckoutBodySchema.parse(request.body || {});
    const productId = getDodoProductId(body.plan);
    const appUrl = (process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173")
      .replace(/\/+$/, "");

    // Fetch user from DB to prefill checkout details
    const db = createDbClient();
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const session = await dodoRequest<DodoCheckoutResponse>("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: body.quantity }],
        customer: {
          email: user?.email || undefined,
          name: user?.name || undefined,
        },
        metadata: {
          user_id: auth.userId,
          org_id: auth.orgId || "",
          plan: body.plan,
        },
        return_url: `${appUrl}/app/billing?checkout=complete`,
      }),
    });

    return sendJson(response, {
      transactionId: session.session_id,
      checkoutUrl: session.checkout_url,
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
