import { issueCsrfToken } from "../_lib/csrf.js";
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
    return response.status(405).json({ error: "Method not allowed" });
  }

  return response.status(200).json({ csrfToken: issueCsrfToken(response) });
}
