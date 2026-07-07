import type { VercelRequest } from "@vercel/node";
import { getClientIp } from "./route-guard.js";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
};

export class TurnstileError extends Error {
  statusCode = 400;
  code = "TURNSTILE_FAILED";

  constructor(message = "Cloudflare Turnstile verification failed.") {
    super(message);
    this.name = "TurnstileError";
  }
}

export const isTurnstileConfigured = () =>
  Boolean(process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim());

export async function verifyTurnstileToken(request: VercelRequest, token?: string | null) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { skipped: true as const };
  }
  if (!token) {
    throw new TurnstileError("Complete the Cloudflare security check before submitting.");
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  const remoteIp = getClientIp(request);
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new TurnstileError(`Cloudflare Turnstile verification returned ${response.status}.`);
  }

  const result = (await response.json()) as TurnstileVerifyResponse;
  if (!result.success) {
    throw new TurnstileError();
  }

  return { skipped: false as const, result };
}
