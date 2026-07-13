import { Webhook } from "svix";
import type { VercelRequest } from "@vercel/node";

export function dodoBaseUrl() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

export async function dodoRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Dodo Payments is not configured. Set DODO_PAYMENTS_API_KEY."), {
      statusCode: 503,
    });
  }

  const response = await fetch(`${dodoBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Dodo Payments API error ${response.status}: ${await response.text()}`),
      { statusCode: 502 },
    );
  }

  return (await response.json()) as T;
}

export async function readRawBody(request: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function verifyDodoWebhookSignature(rawBody: string, headers: Record<string, string | string[] | undefined>) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("DODO_PAYMENTS_WEBHOOK_SECRET is not configured.");
  }

  const getHeader = (name: string): string | undefined => {
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const webhookId = getHeader("webhook-id");
  const webhookSignature = getHeader("webhook-signature");
  const webhookTimestamp = getHeader("webhook-timestamp");

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    throw new Error("Missing required Dodo webhook headers (webhook-id, webhook-signature, webhook-timestamp).");
  }

  // Standard Webhooks (via Svix library) uses headers "svix-id", "svix-timestamp", "svix-signature"
  const wh = new Webhook(secret);
  wh.verify(rawBody, {
    "svix-id": webhookId,
    "svix-timestamp": webhookTimestamp,
    "svix-signature": webhookSignature,
  });
}

export function getDodoProductId(plan: "pro" | "team" | "enterprise"): string {
  const map = {
    pro: process.env.DODO_PRO_PRODUCT_ID,
    team: process.env.DODO_TEAM_PRODUCT_ID,
    enterprise: process.env.DODO_ENTERPRISE_PRODUCT_ID,
  };
  const productId = map[plan];
  if (!productId) {
    throw Object.assign(new Error(`Dodo Payments product id is not configured for plan ${plan}.`), {
      statusCode: 503,
    });
  }
  return productId;
}
