/**
 * Embedding utility for semantic search.
 * Uses OpenAI text-embedding-3-small (1536 dims) by default.
 * Falls back to other providers if OpenAI key is not available.
 */
import { logger } from "./log.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

const isKeyConfigured = (key?: string) => {
  return Boolean(key && key.trim() !== "" && key !== "sk-placeholder");
};

export async function embedText(text: string): Promise<number[]> {
  if (!isKeyConfigured(OPENAI_API_KEY)) {
    throw new Error("OpenAI API key is missing or not configured (placeholder detected). Set a valid OPENAI_API_KEY for fact embeddings.");
  }

  const response = await fetch(EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text.slice(0, 8000), // Max input length
      model: EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Embedding error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0]?.embedding || [];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!isKeyConfigured(OPENAI_API_KEY)) {
    throw new Error("OpenAI API key is missing or not configured (placeholder detected). Set a valid OPENAI_API_KEY for fact embeddings.");
  }

  // Batch embeddings - process in chunks of 100
  const results: number[][] = [];
  const chunkSize = 100;

  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += chunkSize) {
    chunks.push(texts.slice(i, i + chunkSize));
  }

  const chunkPromises = chunks.map(async (chunk) => {
    const response = await fetch(EMBEDDING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: chunk.map((t) => t.slice(0, 8000)),
        model: EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`Batch embedding error ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }> | undefined;
    };

    const embeddings = data.data ?? [];
    return embeddings.map((d) => d.embedding);
  });

  const chunkResults = await Promise.all(chunkPromises);
  for (const chunkEmbeddings of chunkResults) {
    results.push(...chunkEmbeddings);
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
