/**
 * Embedding utility for semantic search.
 * Supports OpenAI text-embedding-3-small (1536 dims) and Azure OpenAI Embeddings
 * with automatic failover when both providers are configured.
 */
import { logger } from "./log.js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_AZURE_API_VERSION = "2024-10-21";

export type EmbeddingBackend = "openai" | "azure";

const isKeyConfigured = (key?: string): boolean => {
  return Boolean(key && key.trim() !== "" && key !== "sk-placeholder");
};

export function isOpenAIEmbeddingConfigured(): boolean {
  return isKeyConfigured(process.env.OPENAI_API_KEY);
}

export function isAzureEmbeddingConfigured(): boolean {
  return Boolean(
    isKeyConfigured(process.env.AZURE_OPENAI_API_KEY) &&
      process.env.AZURE_OPENAI_ENDPOINT?.trim(),
  );
}

export function buildAzureEmbeddingUrl(
  endpointRaw: string,
  deploymentRaw?: string,
  apiVersionRaw?: string,
): string {
  const endpoint = endpointRaw.trim().replace(/\/+$/, "");
  const deployment = (
    deploymentRaw ||
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ||
    EMBEDDING_MODEL
  ).trim();
  const apiVersion = (
    apiVersionRaw ||
    process.env.AZURE_OPENAI_API_VERSION ||
    DEFAULT_AZURE_API_VERSION
  ).trim();

  if (endpoint.includes("/embeddings")) {
    if (endpoint.includes("api-version=")) {
      return endpoint;
    }
    const separator = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${separator}api-version=${encodeURIComponent(apiVersion)}`;
  }

  return `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/embeddings?api-version=${encodeURIComponent(apiVersion)}`;
}

function getOrderedEmbeddingBackends(): EmbeddingBackend[] {
  const preferred = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() as
    | EmbeddingBackend
    | undefined;
  const configured: Record<EmbeddingBackend, boolean> = {
    openai: isOpenAIEmbeddingConfigured(),
    azure: isAzureEmbeddingConfigured(),
  };

  const defaultOrder: EmbeddingBackend[] = ["openai", "azure"];
  const ordered =
    preferred && defaultOrder.includes(preferred)
      ? [preferred, ...defaultOrder.filter((name) => name !== preferred)]
      : defaultOrder;

  return ordered.filter((name) => configured[name]);
}

async function requestEmbeddingBatch(
  backend: EmbeddingBackend,
  inputs: string[],
): Promise<number[][]> {
  const truncatedInputs = inputs.map((t) => t.slice(0, 8000));

  if (backend === "azure") {
    const apiKey = process.env.AZURE_OPENAI_API_KEY!.trim();
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!.trim();
    const deployment = (
      process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || EMBEDDING_MODEL
    ).trim();
    const url = buildAzureEmbeddingUrl(endpoint, deployment);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: truncatedInputs.length === 1 ? truncatedInputs[0] : truncatedInputs,
        model: deployment,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`Azure embedding error ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[] }>;
    };
    return (data.data ?? []).map((d) => d.embedding);
  }

  const openaiKey = process.env.OPENAI_API_KEY!.trim();
  const response = await fetch(OPENAI_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      input: truncatedInputs.length === 1 ? truncatedInputs[0] : truncatedInputs,
      model: EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Embedding error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };
  return (data.data ?? []).map((d) => d.embedding);
}

async function requestWithFailover(inputs: string[]): Promise<number[][]> {
  const backends = getOrderedEmbeddingBackends();
  if (backends.length === 0) {
    throw new Error(
      "Embedding provider is missing or not configured. Set OPENAI_API_KEY or AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT for fact embeddings.",
    );
  }

  let lastError: unknown;
  for (let i = 0; i < backends.length; i++) {
    const backend = backends[i];
    try {
      return await requestEmbeddingBatch(backend, inputs);
    } catch (error) {
      lastError = error;
      if (i + 1 < backends.length) {
        logger.warn("Primary embedding provider failed; failing over", {
          failedBackend: backend,
          nextBackend: backends[i + 1],
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function embedText(text: string): Promise<number[]> {
  const vectors = await requestWithFailover([text]);
  return vectors[0] || [];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (getOrderedEmbeddingBackends().length === 0) {
    throw new Error(
      "Embedding provider is missing or not configured. Set OPENAI_API_KEY or AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT for fact embeddings.",
    );
  }

  // Batch embeddings - process in chunks of 100
  const results: number[][] = [];
  const chunkSize = 100;

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const embeddings = await requestWithFailover(chunk);
    results.push(...embeddings);
  }

  return results;
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension.");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find top-K most similar facts to a query embedding.
 */
export function findTopK<T>(
  queryEmbedding: number[],
  items: Array<{ embedding: number[]; data: T }>,
  k: number,
): Array<{ similarity: number; data: T }> {
  const scored = items.map((item) => ({
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
    data: item.data,
  }));

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

export function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}
