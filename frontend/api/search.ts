import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "./_lib/auth.js";
import { embedText, toVectorLiteral } from "./_lib/embeddings.js";
import { sendJson } from "./_lib/sideby.js";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

const SearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

type SearchRow = {
  id: string;
  query: string;
  slug: string;
  status: string;
  source_count: number;
  overall_confidence: string | null;
  updated_at: Date | string;
  similarity: number | string;
};

function getRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
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
    const parsed = SearchQuerySchema.parse(request.query);
    const db = createDbClient();

    try {
      const queryEmbedding = await embedText(parsed.q);
      const vectorLiteral = toVectorLiteral(queryEmbedding);
      const result = await db.execute(sql<SearchRow>`
        select
          id,
          query,
          slug,
          status,
          source_count,
          overall_confidence,
          updated_at,
          (1 - (query_embedding <=> ${vectorLiteral}::vector))::float as similarity
        from comparisons
        where query_embedding is not null
          and status = 'completed'
          and (
            clerk_user_id = ${auth.userId}
            ${auth.orgId ? sql`or clerk_org_id = ${auth.orgId}` : sql``}
            or visibility = 'public'
          )
        order by query_embedding <=> ${vectorLiteral}::vector
        limit ${parsed.limit}
      `);

      return sendJson(response, {
        results: getRows<SearchRow>(result).map((row) => ({
          id: row.id,
          query: row.query,
          slug: row.slug,
          status: row.status,
          sourceCount: row.source_count,
          overallConfidence: row.overall_confidence ? Number(row.overall_confidence) : null,
          updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
          similarity: Number(row.similarity),
        })),
      });
    } catch {
      const rows = await db
        .select()
        .from(comparisons)
        .where(
          and(
            eq(comparisons.status, "completed"),
            ilike(comparisons.query, `%${parsed.q}%`),
            or(
              eq(comparisons.clerkUserId, auth.userId),
              auth.orgId ? eq(comparisons.clerkOrgId, auth.orgId) : eq(comparisons.clerkUserId, auth.userId),
              eq(comparisons.visibility, "public"),
            ),
          ),
        )
        .orderBy(desc(comparisons.updatedAt))
        .limit(parsed.limit);

      return sendJson(response, {
        results: rows.map((row) => ({
          id: row.id,
          query: row.query,
          slug: row.slug,
          status: row.status,
          sourceCount: row.sourceCount,
          overallConfidence: row.overallConfidence ? Number(row.overallConfidence) : null,
          updatedAt: row.updatedAt.toISOString(),
          similarity: null,
        })),
      });
    }
  } catch (error) {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode: number }).statusCode
          : 500;
    return sendJson(
      response,
      {
        error: error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid search query."
          : error instanceof Error ? error.message : "Unable to search comparisons.",
      },
      status,
    );
  }
}
