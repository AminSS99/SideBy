/**
 * DELETE /api/knowledge/documents/:id — soft-delete an uploaded document.
 */
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../../../src/db/index.js";
import { knowledgeDocuments } from "../../../src/db/schema.js";
import { captureServerEvent } from "../../_lib/analytics.js";
import { requireAuth } from "../../_lib/auth.js";
import {
  KnowledgeApiError,
  getKnowledgeDocumentForMutation,
  toKnowledgeDocumentDto,
} from "../../_lib/knowledge.js";
import { serverEnv } from "../../_lib/env.js";
import { sendJson } from "../../_lib/sideby.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "DELETE") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  try {
    const auth = await requireAuth(request);
    const id = getQueryValue(request.query.id);

    if (!id) {
      return sendJson(response, { error: "Document id is required." }, 400);
    }

    const db = createDbClient();
    const document = await getKnowledgeDocumentForMutation(db, {
      userId: auth.userId,
      documentId: id,
    });

    const [deletedDocument] = await db
      .update(knowledgeDocuments)
      .set({
        status: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, id))
      .returning();

    if (serverEnv.blobReadWriteToken) {
      await del(document.blobUrl, { token: serverEnv.blobReadWriteToken }).catch((error) => {
        console.warn("Failed to delete Vercel Blob object", error);
      });
    }

    captureServerEvent(auth.userId, "knowledge_document_deleted", {
      document_id: document.id,
      workspace_id: document.workspaceId,
      project_id: document.projectId,
    });

    return sendJson(response, {
      document: toKnowledgeDocumentDto(deletedDocument),
    });
  } catch (error) {
    return sendJson(
      response,
      { error: error instanceof Error ? error.message : "Document delete failed." },
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
