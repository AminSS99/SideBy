import { neon } from "@neondatabase/serverless";
import { sendJson } from "../../_lib/sideby.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
};

const getDb = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
  return url ? neon(url) : null;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const slug = Array.isArray(request.query.slug)
      ? request.query.slug[0]
      : request.query.slug;
    if (!slug) {
      return sendJson(response, { error: "Comparison slug is required." }, 400);
    }

    const sql = getDb();
    if (!sql) {
      return sendJson(response, { error: "Database not configured." }, 500);
    }

    const rows = await sql`
      select id, status, progress, active_step, query, result, error_message, source_count, updated_at
      from comparisons
      where slug = ${slug} and status = 'completed' and visibility = 'public'
      order by updated_at desc
      limit 1
    `;

    if (!rows[0] || !rows[0].result) {
      return sendJson(response, { error: "Comparison not found." }, 404);
    }

    const d = rows[0];
    return sendJson(response, {
      id: d.id,
      status: "completed",
      progress: 100,
      activeStep: d.active_step,
      query: d.query,
      result: d.result,
      error: null,
    });
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Unable to load comparison." },
      500,
    );
  }
}
