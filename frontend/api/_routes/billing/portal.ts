import { eq } from "drizzle-orm";
import { requireAuth } from "../../_lib/auth.js";
import { dodoRequest } from "../../_lib/dodo.js";
import { sendJson } from "../../_lib/sideby.js";
import { createDbClient } from "../../../src/db/index.js";
import { organizations, users } from "../../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 20,
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
    const db = createDbClient();

    const [user] = await db
      .select({ providerCustomerId: users.providerCustomerId })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const [org] = auth.orgId
      ? await db
          .select({ providerCustomerId: organizations.providerCustomerId })
          .from(organizations)
          .where(eq(organizations.id, auth.orgId))
          .limit(1)
      : [];

    const customerId = org?.providerCustomerId || user?.providerCustomerId;
    if (!customerId) {
      return sendJson(response, { error: "No billing customer is linked to this account." }, 404);
    }

    const appUrl = (process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173")
      .replace(/\/+$/, "");

    const portal = await dodoRequest<{ link: string }>(
      `/customers/${customerId}/customer-portal/session?return_url=${encodeURIComponent(appUrl + "/app/billing")}`,
      {
        method: "POST",
      },
    );

    return sendJson(response, {
      url: portal.link,
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
