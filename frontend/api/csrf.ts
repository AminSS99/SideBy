import { issueCsrfToken } from "./_lib/csrf.js";
import { sendJson } from "./_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 5,
};

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  return sendJson(response, { csrfToken: issueCsrfToken(response) });
}
