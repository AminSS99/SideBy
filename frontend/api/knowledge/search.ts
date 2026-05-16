/**
 * POST /api/knowledge/search — semantic pgvector search over accessible chunks.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../../src/db/index.js";
import { requireAuth } from "../_lib/auth.js";
import { KnowledgeApiError, searchKnowledgeChunks } from "../_lib/knowledge.js";
import { sendJson } from "../_lib/sideby.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

type SearchBody = {
  query?: string;
  workspaceId?: string;
  projectId?: string | null;
  documentIds?: string[];
  topK?: number;
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
    const body = request.body as SearchBody;

    if (!body.query?.trim()) {
      return sendJson(response, { error: "query is required." }, 400);
    }
    if (!body.workspaceId) {
      return sendJson(response, { error: "workspaceId is required." }, 400);
    }

    const db = createDbClient();
    const chunks = await searchKnowledgeChunks(db, {
      userId: auth.userId,
      workspaceId: body.workspaceId,
      projectId: body.projectId || null,
      documentIds: Array.isArray(body.documentIds) ? body.documentIds : undefined,
      query: body.query,
      topK: body.topK,
    });

    return sendJson(response, { chunks });
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Knowledge search failed." },
      getErrorStatus(error),
    );
  }
}

function getErrorStatus(error: unknown) {
  if (error instanceof KnowledgeApiError) return error.statusCode;
  if (error instanceof Error && "statusCode" in error) {
    return (error as Error & { statusCode: number }).statusCode;
  }
  return 500;
}
