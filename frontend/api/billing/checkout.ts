import { z } from "zod";
import { requireAuth } from "../_lib/auth.js";
import { paddleRequest, getPaddlePriceId } from "../_lib/paddle.js";
import { sendJson } from "../_lib/sideby.js";
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
  returnUrl: z.string().url().optional(),
});

type PaddleTransactionResponse = {
  data: {
    id: string;
    checkout?: { url?: string | null };
  };
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
    const body = CheckoutBodySchema.parse(request.body || {});
    const priceId = getPaddlePriceId(body.plan);
    const appUrl = process.env.VITE_APP_URL || "http://localhost:5173";

    const transaction = await paddleRequest<PaddleTransactionResponse>("/transactions", {
      method: "POST",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: body.quantity }],
        collection_mode: "automatic",
        custom_data: {
          user_id: auth.userId,
          org_id: auth.orgId || null,
          plan: body.plan,
        },
        checkout: {
          url: body.returnUrl || `${appUrl}/app/billing?checkout=complete`,
        },
      }),
    });

    return sendJson(response, {
      transactionId: transaction.data.id,
      checkoutUrl: transaction.data.checkout?.url || null,
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
