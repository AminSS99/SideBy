import { waitUntil } from "@vercel/functions";
import { drainQueuedComparisonJobs } from "../_lib/job-engine.js";
import { sendJson } from "../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

function isProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function isAuthorized(request: VercelRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return !isProductionRuntime();

  const header = request.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value === `Bearer ${secret}`;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET" && request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  if (!isAuthorized(request)) {
    return sendJson(response, { error: "Not found." }, 404);
  }

  const result = await drainQueuedComparisonJobs(5, waitUntil);
  return sendJson(response, { ok: true, ...result });
}
