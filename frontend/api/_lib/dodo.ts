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
    await response.text().catch(() => "");
    throw Object.assign(
      new Error(`Dodo Payments API request failed (${response.status}).`),
      { statusCode: 502 },
    );
  }

  return (await response.json()) as T;
}

const MAX_RAW_BODY_BYTES = 1024 * 1024; // 1 MiB

export async function readRawBody(request: VercelRequest, maxBytes = MAX_RAW_BODY_BYTES): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > maxBytes) {
      throw Object.assign(new Error("Webhook payload too large."), { statusCode: 413 });
    }
    chunks.push(buffer);
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
