/**
 * GET /api/knowledge/documents — list uploaded knowledge docs by workspace/project.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../../src/db/index.js";
import { requireAuth } from "../_lib/auth.js";
import { KnowledgeApiError, listKnowledgeDocuments } from "../_lib/knowledge.js";
import { sendJson } from "../_lib/sideby.js";

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
    const workspaceId = getQueryValue(request.query.workspaceId);
    const projectId = getQueryValue(request.query.projectId);

    if (!workspaceId) {
      return sendJson(response, { error: "workspaceId query parameter is required." }, 400);
    }

    const db = createDbClient();
    const documents = await listKnowledgeDocuments(db, {
      userId: auth.userId,
      workspaceId,
      projectId,
    });

    return sendJson(response, { documents });
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Failed to load documents." },
      getErrorStatus(error),
    );
  }
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorStatus(error: unknown) {
  if (error instanceof KnowledgeApiError) return error.statusCode;
  if (error instanceof Error && "statusCode" in error) {
    return (error as Error & { statusCode: number }).statusCode;
  }
  return 500;
}
