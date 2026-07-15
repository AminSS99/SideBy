import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth.js";
import { createDbClient } from "../../src/db/index.js";
import { consentRecords } from "../../src/db/schema.js";
import { sendJson } from "../_lib/sideby.js";

const ConsentBodySchema = z.object({
  analytics: z.boolean(),
  policyVersion: z.literal("2026-07-14"),
  source: z.enum(["banner", "settings"]),
  globalPrivacyControl: z.boolean(),
});

function getHeader(request: VercelRequest, name: string): string | null {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || null : value || null;
}

function getClientIp(request: VercelRequest): string | null {
  const forwardedFor = getHeader(request, "x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim().slice(0, 64) || null;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const auth = await requireAuth(request);
    const db = createDbClient();

    if (request.method === "GET") {
      const [latest] = await db
        .select()
        .from(consentRecords)
        .where(eq(consentRecords.clerkUserId, auth.userId))
        .orderBy(desc(consentRecords.createdAt))
        .limit(1);
      return sendJson(response, { consent: latest || null });
    }

    if (request.method === "POST") {
      const body = ConsentBodySchema.parse(request.body || {});
      const [record] = await db
        .insert(consentRecords)
        .values({
          clerkUserId: auth.userId,
          analytics: body.analytics,
          policyVersion: body.policyVersion,
          source: body.source,
          globalPrivacyControl: body.globalPrivacyControl,
          ipAddress: getClientIp(request),
          userAgent: getHeader(request, "user-agent")?.slice(0, 1024) || null,
        })
        .returning();
      return sendJson(response, { consent: record }, 201);
    }

    return sendJson(response, { error: "Method not allowed" }, 405);
  } catch (error) {
    const status = error instanceof z.ZodError
      ? 400
      : error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(response, {
      error: error instanceof z.ZodError
        ? error.errors[0]?.message || "Invalid consent record."
        : error instanceof Error ? error.message : "Unable to save consent.",
    }, status);
  }
}
