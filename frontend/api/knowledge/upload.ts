/**
 * POST /api/knowledge/upload — authenticated multipart upload + synchronous indexing.
 */
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";
import formidable from "formidable";
import type { File as FormidableFile } from "formidable";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDbClient } from "../../src/db/index.js";
import { knowledgeDocuments } from "../../src/db/schema.js";
import { captureServerEvent } from "../_lib/analytics.js";
import { requireAuth } from "../_lib/auth.js";
import {
  KnowledgeApiError,
  assertKnowledgeScopeAccess,
  markKnowledgeDocumentError,
  persistKnowledgeChunks,
  toKnowledgeDocumentDto,
} from "../_lib/knowledge.js";
import {
  KnowledgeProcessingError,
  buildKnowledgeBlobKey,
  chunkKnowledgeText,
  extractTextFromKnowledgeFile,
  getKnowledgeMaxUploadBytes,
  validateKnowledgeFile,
} from "../_lib/knowledge-processing.js";
import { serverEnv } from "../_lib/env.js";
import { sendJson } from "../_lib/sideby.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 300,
  api: {
    bodyParser: false,
  },
};

type ParsedUpload = {
  workspaceId: string;
  projectId: string | null;
  file: FormidableFile;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  let documentId: string | null = null;
  let authUserId: string | null = null;
  let eventBase: Record<string, unknown> = {};

  try {
    const auth = await requireAuth(request);
    authUserId = auth.userId;
    const parsed = await parseUploadRequest(request);
    const db = createDbClient();

    await assertKnowledgeScopeAccess(db, auth.userId, parsed.workspaceId, parsed.projectId);

    const filename = parsed.file.originalFilename || "upload";
    const mimeType = parsed.file.mimetype || "application/octet-stream";
    const kind = validateKnowledgeFile({
      filename,
      mimeType,
      sizeBytes: parsed.file.size,
    });

    if (!serverEnv.blobReadWriteToken) {
      return sendJson(response, { error: "Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN." }, 500);
    }

    documentId = randomUUID();
    eventBase = {
      workspace_id: parsed.workspaceId,
      project_id: parsed.projectId,
      document_id: documentId,
      filename,
      mime_type: mimeType,
      size_bytes: parsed.file.size,
    };
    captureServerEvent(auth.userId, "knowledge_upload_started", eventBase);

    const buffer = await readFile(parsed.file.filepath);
    const blobKey = buildKnowledgeBlobKey({
      workspaceId: parsed.workspaceId,
      documentId,
      filename,
    });
    const blob = await put(blobKey, buffer, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: mimeType,
      multipart: buffer.length > 4 * 1024 * 1024,
      token: serverEnv.blobReadWriteToken,
    });

    const [document] = await db
      .insert(knowledgeDocuments)
      .values({
        id: documentId,
        workspaceId: parsed.workspaceId,
        projectId: parsed.projectId,
        uploadedBy: auth.userId,
        filename,
        mimeType,
        sizeBytes: parsed.file.size,
        blobUrl: blob.url,
        blobKey: blob.pathname,
        status: "indexing",
        metadata: {
          blobContentType: blob.contentType,
          blobEtag: blob.etag,
        },
      })
      .returning();

    try {
      const text = await extractTextFromKnowledgeFile(buffer, kind);
      const chunks = chunkKnowledgeText(text);

      if (chunks.length === 0) {
        throw new KnowledgeProcessingError("No text could be extracted from this document.", 422);
      }

      const indexedDocument = await persistKnowledgeChunks(db, {
        documentId,
        workspaceId: parsed.workspaceId,
        projectId: parsed.projectId,
        chunks,
      });

      captureServerEvent(auth.userId, "knowledge_upload_succeeded", {
        ...eventBase,
        chunk_count: chunks.length,
      });

      return sendJson(response, { document: indexedDocument }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Document indexing failed.";
      const failedDocument = await markKnowledgeDocumentError(db, documentId, message);
      captureServerEvent(auth.userId, "knowledge_upload_failed", {
        ...eventBase,
        error: message,
      });

      const status = error instanceof KnowledgeProcessingError ? 201 : 500;
      return sendJson(
        response,
        {
          document: failedDocument ?? toKnowledgeDocumentDto(document),
          error: message,
        },
        status,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    if (documentId && authUserId) {
      captureServerEvent(authUserId, "knowledge_upload_failed", {
        ...eventBase,
        error: message,
      });
    }
    return sendJson(response, { error: message }, getErrorStatus(error));
  }
}

async function parseUploadRequest(request: VercelRequest): Promise<ParsedUpload> {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: getKnowledgeMaxUploadBytes(),
    allowEmptyFiles: false,
  });

  const [fields, files] = await form.parse(request);
  const workspaceId = getFormValue(fields.workspaceId);
  const projectId = getFormValue(fields.projectId) || null;
  const file = getFormFile(files.file);

  if (!workspaceId) {
    throw new KnowledgeProcessingError("workspaceId is required.");
  }
  if (!file) {
    throw new KnowledgeProcessingError("A file upload is required.");
  }

  return { workspaceId, projectId, file };
}

function getFormValue(value: string[] | undefined) {
  return Array.isArray(value) ? value[0] : undefined;
}

function getFormFile(value: FormidableFile | FormidableFile[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorStatus(error: unknown) {
  if (error instanceof KnowledgeApiError || error instanceof KnowledgeProcessingError) {
    return error.statusCode;
  }
  if (error instanceof Error && "statusCode" in error) {
    return (error as Error & { statusCode: number }).statusCode;
  }
  return 500;
}
