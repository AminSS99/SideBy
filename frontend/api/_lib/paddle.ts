import crypto from "crypto";
import type { VercelRequest } from "@vercel/node";

export function paddleBaseUrl() {
  return process.env.PADDLE_ENVIRONMENT === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";
}

export async function paddleRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Paddle is not configured. Set PADDLE_API_KEY."), {
      statusCode: 503,
    });
  }

  const response = await fetch(`${paddleBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Paddle API error ${response.status}: ${await response.text()}`),
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

function parsePaddleSignature(header: string) {
  const values = new Map<string, string[]>();
  for (const part of header.split(";")) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    const list = values.get(key) || [];
    list.push(value);
    values.set(key, list);
  }
  return {
    timestamp: values.get("ts")?.[0],
    signatures: values.get("h1") || [],
  };
}

export function verifyPaddleWebhookSignature(rawBody: string, signatureHeader?: string | string[]) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("PADDLE_WEBHOOK_SECRET is not configured.");
  }

  const header = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!header) {
    throw new Error("Missing Paddle-Signature header.");
  }

  const { timestamp, signatures } = parsePaddleSignature(header);
  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Paddle-Signature header.");
  }

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw new Error("Paddle webhook timestamp is outside the allowed window.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const valid = signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");
    return signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });

  if (!valid) {
    throw new Error("Paddle webhook signature verification failed.");
  }
}

export function getPaddlePriceId(plan: "pro" | "team" | "enterprise") {
  const map = {
    pro: process.env.PADDLE_PRO_PRICE_ID,
    team: process.env.PADDLE_TEAM_PRICE_ID,
    enterprise: process.env.PADDLE_ENTERPRISE_PRICE_ID,
  };
  const priceId = map[plan];
  if (!priceId) {
    throw Object.assign(new Error(`Paddle price id is not configured for ${plan}.`), {
      statusCode: 503,
    });
  }
  return priceId;
}
