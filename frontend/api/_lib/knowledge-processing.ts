import { extname } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { PDFParse } from "pdf-parse";
import { serverEnv } from "./env.js";

export const KNOWLEDGE_ALLOWED_EXTENSIONS = [".pdf", ".txt", ".csv"] as const;

const PDF_MIME_TYPES = new Set(["application/pdf"]);
const TXT_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
const CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
]);

const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"]);

export class KnowledgeProcessingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export type KnowledgeFileKind = "pdf" | "txt" | "csv";

export interface KnowledgeFileInfo {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface KnowledgeChunkInput {
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
  metadata: Record<string, unknown>;
}

export function getKnowledgeMaxUploadBytes() {
  const configured = Number(serverEnv.knowledgeMaxUploadBytes);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return 25 * 1024 * 1024;
}

export function sanitizeFilename(filename: string) {
  return filename
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160) || "upload";
}

export function getKnowledgeFileKind(filename: string): KnowledgeFileKind | null {
  const extension = extname(filename).toLowerCase();
  if (extension === ".pdf") return "pdf";
  if (extension === ".txt") return "txt";
  if (extension === ".csv") return "csv";
  return null;
}

export function validateKnowledgeFile(file: KnowledgeFileInfo): KnowledgeFileKind {
  const kind = getKnowledgeFileKind(file.filename);
  if (!kind) {
    throw new KnowledgeProcessingError("Unsupported file type. Upload PDF, TXT, or CSV files only.");
  }

  const maxUploadBytes = getKnowledgeMaxUploadBytes();
  if (file.sizeBytes <= 0) {
    throw new KnowledgeProcessingError("Uploaded file is empty.");
  }
  if (file.sizeBytes > maxUploadBytes) {
    throw new KnowledgeProcessingError(
      `File is too large. Maximum upload size is ${formatBytes(maxUploadBytes)}.`,
      413,
    );
  }

  const normalizedMime = file.mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (GENERIC_MIME_TYPES.has(normalizedMime)) return kind;

  const allowed =
    kind === "pdf"
      ? PDF_MIME_TYPES
      : kind === "csv"
        ? CSV_MIME_TYPES
        : TXT_MIME_TYPES;

  if (!allowed.has(normalizedMime)) {
    throw new KnowledgeProcessingError("Unsupported file MIME type. Upload PDF, TXT, or CSV files only.");
  }

  return kind;
}

export async function extractTextFromKnowledgeFile(
  buffer: Buffer,
  kind: KnowledgeFileKind,
): Promise<string> {
  if (kind === "txt") {
    return normalizeExtractedText(buffer.toString("utf8"));
  }

  if (kind === "csv") {
    return extractCsvText(buffer);
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = normalizeExtractedText(result.text || "");
    if (text.length < 40) {
      throw new KnowledgeProcessingError("PDF text could not be extracted.", 422);
    }
    return text;
  } finally {
    await parser.destroy();
  }
}

export function chunkKnowledgeText(text: string): KnowledgeChunkInput[] {
  const normalized = normalizeExtractedText(text);
  if (!normalized) return [];

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const targetWords = 760;
  const overlapWords = 90;
  const chunks: KnowledgeChunkInput[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(" ").trim();

    if (chunkText) {
      chunks.push({
        chunkIndex: chunks.length,
        text: chunkText,
        tokenEstimate: estimateTokenCount(chunkText),
        metadata: {
          wordStart: start,
          wordEnd: end,
        },
      });
    }

    if (end >= words.length) break;
    start = Math.max(end - overlapWords, start + 1);
  }

  return chunks;
}

export function estimateTokenCount(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 0.75));
}

export function buildKnowledgeBlobKey(params: {
  workspaceId: string;
  documentId: string;
  filename: string;
}) {
  return `knowledge/${params.workspaceId}/${params.documentId}/${sanitizeFilename(params.filename)}`;
}

function extractCsvText(buffer: Buffer) {
  const raw = normalizeExtractedText(buffer.toString("utf8"));
  if (!raw) return "";

  const records = parseCsv(raw, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    return raw;
  }

  return records
    .map((row, index) => {
      const fields = Object.entries(row)
        .filter(([, value]) => String(value ?? "").trim().length > 0)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");
      return fields ? `Row ${index + 1}: ${fields}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeExtractedText(text: string) {
  return text
    .split("\u0000")
    .join("")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
