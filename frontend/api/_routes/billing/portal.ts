import { requireAuth } from "../../_lib/auth.js";
import { sendJson } from "../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 20,
};

const SNAP_SOLVE_BILLING_URL = "https://snapsolve.ink/cockpit/#/subscription";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    await requireAuth(request);

    return sendJson(response, {
      url: SNAP_SOLVE_BILLING_URL,
      billingProvider: "snapsolve",
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to create billing portal session." },
      status,
    );
  }
}
