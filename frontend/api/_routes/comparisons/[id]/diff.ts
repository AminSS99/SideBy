import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../_lib/auth.js";
import { canAccessComparison } from "../../../_lib/db-auth.js";
import { sendJson } from "../../../_lib/sideby.js";
import { createDbClient } from "../../../../src/db/index.js";
import { comparisonVersions } from "../../../../src/db/schema.js";
import { computeResultDiff } from "../../../_lib/diff-engine.js";
import type { DiffResult } from "../../../_lib/diff-engine.js";
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

    const fromVersion = request.query.fromVersion;
    const toVersion = request.query.toVersion;
    if (!fromVersion || !toVersion) {
      return sendJson(response, { error: "Both fromVersion and toVersion query parameters are required." }, 400);
    }

    const db = createDbClient();
    const hasAccess = await canAccessComparison(db, auth.userId, id);
    if (!hasAccess) return sendJson(response, { error: "Comparison not found." }, 404);

    const [fromVer] = await db
      .select({ result: comparisonVersions.result })
      .from(comparisonVersions)
      .where(
        and(
          eq(comparisonVersions.comparisonId, id),
          eq(comparisonVersions.versionNumber, Number(fromVersion)),
        ),
      )
      .limit(1);

    const [toVer] = await db
      .select({ result: comparisonVersions.result })
      .from(comparisonVersions)
      .where(
        and(
          eq(comparisonVersions.comparisonId, id),
          eq(comparisonVersions.versionNumber, Number(toVersion)),
        ),
      )
      .limit(1);

    if (!fromVer || !toVer) {
      return sendJson(response, { error: "One or both versions not found." }, 404);
    }

    const diffResult = computeResultDiff(
      fromVer.result as DiffResult | null,
      toVer.result as DiffResult | null,
    );

    return sendJson(response, {
      fromVersion: Number(fromVersion),
      toVersion: Number(toVersion),
      diff: diffResult.diff,
      thresholdBreached: diffResult.thresholdBreached,
    });
  } catch (error) {
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to compute comparison diff." },
      status,
    );
  }
}
