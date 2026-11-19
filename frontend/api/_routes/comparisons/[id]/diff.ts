import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../_lib/auth.js";
import { canAccessComparisonAsMember } from "../../../_lib/db-auth.js";
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

function parsePositiveInt(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 1_000_000 ? parsed : null;
}

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

    const fromVersion = parsePositiveInt(request.query.fromVersion);
    const toVersion = parsePositiveInt(request.query.toVersion);
    if (fromVersion === null || toVersion === null) {
      return sendJson(response, { error: "Both fromVersion and toVersion must be positive integers." }, 400);
    }

    const db = createDbClient();
    const hasAccess = await canAccessComparisonAsMember(db, auth.userId, id);
    if (!hasAccess) return sendJson(response, { error: "Comparison not found." }, 404);

    const [fromVer] = await db
      .select({ result: comparisonVersions.result })
      .from(comparisonVersions)
      .where(
        and(
          eq(comparisonVersions.comparisonId, id),
          eq(comparisonVersions.versionNumber, fromVersion),
        ),
      )
      .limit(1);

    const [toVer] = await db
      .select({ result: comparisonVersions.result })
      .from(comparisonVersions)
      .where(
        and(
          eq(comparisonVersions.comparisonId, id),
          eq(comparisonVersions.versionNumber, toVersion),
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
      fromVersion,
      toVersion,
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
