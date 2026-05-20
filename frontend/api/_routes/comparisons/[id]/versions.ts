import { asc, eq } from "drizzle-orm";
import { requireAuth } from "../../../_lib/auth.js";
import { canAccessComparison } from "../../../_lib/db-auth.js";
import { sendJson } from "../../../_lib/sideby.js";
import { createDbClient } from "../../../../src/db/index.js";
import { comparisonVersions } from "../../../../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
    if (!id) return sendJson(response, { error: "Comparison id is required." }, 400);

    const db = createDbClient();
    const hasAccess = await canAccessComparison(db, auth.userId, id);
    if (!hasAccess) return sendJson(response, { error: "Comparison not found." }, 404);

    const versions = await db
      .select()
      .from(comparisonVersions)
      .where(eq(comparisonVersions.comparisonId, id))
      .orderBy(asc(comparisonVersions.versionNumber));

    return sendJson(response, {
      versions: versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        result: version.result,
        sourceCount: version.sourceCount,
        overallConfidence: version.overallConfidence ? Number(version.overallConfidence) : null,
        changeSummary: version.changeSummary,
        createdAt: version.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparison versions." },
      status,
    );
  }
}
