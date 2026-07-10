import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { validateComparisonQuery } from "../../_lib/comparison-validator.js";
import { checkRateLimit } from "../../_lib/rate-limit.js";

const BodySchema = z.object({
  query: z.string().trim().min(1).max(800),
});

const sendJson = (response: VercelResponse, payload: unknown, status = 200) => {
  response.setHeader("Cache-Control", "private, max-age=60");
  return response.status(status).json(payload);
};

const getClientIp = (request: VercelRequest) => {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || null;
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() || null;
  return request.socket?.remoteAddress || null;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const ip = getClientIp(request);
    if (!ip) return sendJson(response, { error: "Unable to validate request." }, 400);

    const limit = await checkRateLimit("ip", ip, "comparison-validation", 12);
    if (!limit.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))));
      return sendJson(response, { error: "Too many validation requests. Please wait a moment." }, 429);
    }

    const { query } = BodySchema.parse(request.body || {});
    const validation = await validateComparisonQuery(query);
    return sendJson(response, validation);
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 500;
    return sendJson(response, {
      error: error instanceof z.ZodError
        ? error.errors[0]?.message || "Invalid request."
        : error instanceof Error ? error.message : "Unable to validate comparison.",
    }, status);
  }
}
