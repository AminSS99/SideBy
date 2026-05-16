import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { DbClient } from "../../src/db/index.js";
import {
  knowledgeChunks,
  knowledgeDocuments,
  projects,
} from "../../src/db/schema.js";
import { canAccessWorkspace } from "./db-auth.js";
import { embedText, embedTexts } from "./embeddings.js";

export type KnowledgeDocumentStatus = "indexing" | "indexed" | "error" | "deleted";

export interface KnowledgeDocumentDto {
  id: string;
  workspaceId: string;
  projectId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: KnowledgeDocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  downloadUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchChunk {
  id: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
  similarity: number;
  metadata: Record<string, unknown>;
}

type KnowledgeDocumentRow = typeof knowledgeDocuments.$inferSelect;

type KnowledgeSearchRow = {
  id: string;
  document_id: string;
  filename: string;
  chunk_index: number;
  text: string;
  token_estimate: number;
  similarity: number | string;
  metadata: Record<string, unknown> | null;
};

export class KnowledgeApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function assertKnowledgeScopeAccess(
  db: DbClient,
  userId: string,
  workspaceId: string,
  projectId?: string | null,
) {
  const hasWorkspaceAccess = await canAccessWorkspace(db, userId, workspaceId);
  if (!hasWorkspaceAccess) {
    throw new KnowledgeApiError("Not authorized to access this workspace.", 403);
  }

  if (!projectId) return;

  const [project] = await db
    .select({ id: projects.id, workspaceId: projects.workspaceId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new KnowledgeApiError("Project not found.", 404);
  }

  if (project.workspaceId !== workspaceId) {
    throw new KnowledgeApiError("Project does not belong to the selected workspace.", 400);
  }
}

export async function listKnowledgeDocuments(
  db: DbClient,
  params: {
    userId: string;
    workspaceId: string;
    projectId?: string | null;
  },
): Promise<KnowledgeDocumentDto[]> {
  await assertKnowledgeScopeAccess(db, params.userId, params.workspaceId, params.projectId);

  const filters = [
    eq(knowledgeDocuments.workspaceId, params.workspaceId),
    isNull(knowledgeDocuments.deletedAt),
  ];

  if (params.projectId) {
    filters.push(eq(knowledgeDocuments.projectId, params.projectId));
  }

  const rows = await db
    .select()
    .from(knowledgeDocuments)
    .where(and(...filters))
    .orderBy(desc(knowledgeDocuments.createdAt));

  return rows.map(toKnowledgeDocumentDto);
}

export async function getKnowledgeDocumentForMutation(
  db: DbClient,
  params: {
    userId: string;
    documentId: string;
  },
) {
  const [document] = await db
    .select()
    .from(knowledgeDocuments)
    .where(and(eq(knowledgeDocuments.id, params.documentId), isNull(knowledgeDocuments.deletedAt)))
    .limit(1);

  if (!document) {
    throw new KnowledgeApiError("Document not found.", 404);
  }

  await assertKnowledgeScopeAccess(db, params.userId, document.workspaceId, document.projectId);
  return document;
}

export async function markKnowledgeDocumentError(
  db: DbClient,
  documentId: string,
  message: string,
) {
  const [document] = await db
    .update(knowledgeDocuments)
    .set({
      status: "error",
      errorMessage: message,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeDocuments.id, documentId))
    .returning();

  return document ? toKnowledgeDocumentDto(document) : null;
}

export async function persistKnowledgeChunks(
  db: DbClient,
  params: {
    documentId: string;
    workspaceId: string;
    projectId?: string | null;
    chunks: Array<{
      chunkIndex: number;
      text: string;
      tokenEstimate: number;
      metadata: Record<string, unknown>;
    }>;
  },
) {
  const embeddings = await embedTexts(params.chunks.map((chunk) => chunk.text));

  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, params.documentId));

  const insertBatchSize = 50;
  for (let start = 0; start < params.chunks.length; start += insertBatchSize) {
    const batch = params.chunks.slice(start, start + insertBatchSize);
    await db.insert(knowledgeChunks).values(
      batch.map((chunk, index) => ({
        documentId: params.documentId,
        workspaceId: params.workspaceId,
        projectId: params.projectId ?? null,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        tokenEstimate: chunk.tokenEstimate,
        embedding: embeddings[start + index],
        metadata: chunk.metadata,
      })),
    );
  }

  const [document] = await db
    .update(knowledgeDocuments)
    .set({
      status: "indexed",
      errorMessage: null,
      chunkCount: params.chunks.length,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeDocuments.id, params.documentId))
    .returning();

  return toKnowledgeDocumentDto(document);
}

export async function searchKnowledgeChunks(
  db: DbClient,
  params: {
    userId: string;
    workspaceId: string;
    projectId?: string | null;
    documentIds?: string[];
    query: string;
    topK?: number;
  },
): Promise<KnowledgeSearchChunk[]> {
  const query = params.query.trim();
  if (!query) {
    throw new KnowledgeApiError("Search query is required.");
  }

  await assertKnowledgeScopeAccess(db, params.userId, params.workspaceId, params.projectId);

  const topK = Math.min(Math.max(params.topK ?? 8, 1), 20);
  const queryEmbedding = await embedText(query);
  const vectorLiteral = toVectorLiteral(queryEmbedding);
  const filters: SQL[] = [
    sql`kd.workspace_id = ${params.workspaceId}`,
    sql`kd.status = 'indexed'`,
    sql`kd.deleted_at is null`,
  ];

  if (params.projectId) {
    filters.push(sql`kd.project_id = ${params.projectId}`);
  }

  if (params.documentIds && params.documentIds.length > 0) {
    filters.push(
      sql`kc.document_id in (${sql.join(params.documentIds.map((id) => sql`${id}`), sql`, `)})`,
    );
  }

  const whereClause = sql.join(filters, sql` and `);
  const result = await db.execute(sql<KnowledgeSearchRow>`
    select
      kc.id,
      kc.document_id,
      kd.filename,
      kc.chunk_index,
      kc.text,
      kc.token_estimate,
      kc.metadata,
      (1 - (kc.embedding <=> ${vectorLiteral}::vector))::float as similarity
    from knowledge_chunks kc
    inner join knowledge_documents kd on kd.id = kc.document_id
    where ${whereClause}
    order by kc.embedding <=> ${vectorLiteral}::vector
    limit ${topK}
  `);

  const rows = getExecuteRows<KnowledgeSearchRow>(result);
  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    filename: row.filename,
    chunkIndex: row.chunk_index,
    text: row.text,
    tokenEstimate: row.token_estimate,
    similarity: Number(row.similarity),
    metadata: row.metadata ?? {},
  }));
}

export function formatKnowledgeContext(chunks: KnowledgeSearchChunk[]) {
  return chunks
    .map((chunk) => {
      const ref = `${chunk.filename} chunk ${chunk.chunkIndex + 1}`;
      return `[${ref}]\n${truncateForPrompt(chunk.text)}`;
    })
    .join("\n\n---\n\n");
}

export function toKnowledgeDocumentDto(document: KnowledgeDocumentRow): KnowledgeDocumentDto {
  return {
    id: document.id,
    workspaceId: document.workspaceId,
    projectId: document.projectId,
    filename: document.filename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    status: normalizeStatus(document.status),
    errorMessage: document.errorMessage,
    chunkCount: document.chunkCount,
    downloadUrl: null,
    createdAt: toIsoString(document.createdAt),
    updatedAt: toIsoString(document.updatedAt),
  };
}

function normalizeStatus(status: string): KnowledgeDocumentStatus {
  if (status === "indexed" || status === "error" || status === "deleted") {
    return status;
  }
  return "indexing";
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

function truncateForPrompt(text: string) {
  if (text.length <= 2200) return text;
  return `${text.slice(0, 2200)}...`;
}

function getExecuteRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}
