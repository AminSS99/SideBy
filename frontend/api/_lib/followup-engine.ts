/**
 * Follow-up AI Engine with Vector Search Retrieval
 * Answers questions grounded in stored comparison facts.
 */
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import {
  comparisons,
  comparisonSources,
  comparisonFacts,
  comparisonQuestions,
} from "../../src/db/schema.js";
import { canAccessComparison } from "./db-auth.js";
import { getPrimaryProvider } from "./providers/index.js";
import { embedText, cosineSimilarity } from "./embeddings.js";
import { logger } from "./log.js";

const FollowUpSchema = z.object({
  answer: z.string(),
  citations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  type: z.enum(["grounded", "inference", "insufficient"]),
});

export async function answerFollowUp(
  comparisonId: string,
  userId: string,
  question: string,
) {
  const db = createDbClient();

  // Verify access
  const hasAccess = await canAccessComparison(db, userId, comparisonId);
  if (!hasAccess) {
    throw new Error("Comparison not found.");
  }

  // Fetch comparison
  const comp = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.id, comparisonId))
    .limit(1);

  if (comp.length === 0) {
    throw new Error("Comparison not found.");
  }

  if (comp[0].status !== "completed") {
    return {
      question,
      answer: "This comparison is still being researched. Please wait for it to complete before asking follow-up questions.",
      citations: [],
      confidence: 0,
      type: "insufficient" as const,
      answeredAt: new Date().toISOString(),
    };
  }

  // Step 1: Try to embed the question (fallback to keyword matching if embeddings fail)
  let questionEmbedding: number[] | null = null;
  try {
    questionEmbedding = await embedText(question);
  } catch (embedError) {
    logger.warn("Embedding failed, falling back to keyword matching", {
      comparisonId,
      error: embedError instanceof Error ? embedError.message : "unknown",
    });
  }

  // Step 2: Fetch all facts for this comparison
  const facts = await db
    .select()
    .from(comparisonFacts)
    .where(eq(comparisonFacts.comparisonId, comparisonId));

  if (facts.length === 0) {
    return {
      question,
      answer: "No facts have been extracted for this comparison yet.",
      citations: [],
      confidence: 0,
      type: "insufficient" as const,
      answeredAt: new Date().toISOString(),
    };
  }

  // Step 3: Find top-K most similar facts
  let topFacts: Array<{ fact: typeof facts[0]; similarity: number }> = [];

  if (questionEmbedding) {
    // Vector similarity path
    const factsWithEmbeddings = facts
      .filter((f) => f.embedding && Array.isArray(f.embedding))
      .map((f) => ({
        fact: f,
        similarity: cosineSimilarity(questionEmbedding, f.embedding as number[]),
      }));

    factsWithEmbeddings.sort((a, b) => b.similarity - a.similarity);
    topFacts = factsWithEmbeddings.slice(0, 15);
  }

  // Fallback: if no embeddings matched, use keyword matching
  if (topFacts.length === 0) {
    const questionWords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const scoredFacts = facts.map((f) => {
      const text = `${f.label || ""} ${f.value || ""}`.toLowerCase();
      const matches = questionWords.filter((w) => text.includes(w)).length;
      return { fact: f, similarity: matches / Math.max(questionWords.length, 1) };
    });
    scoredFacts.sort((a, b) => b.similarity - a.similarity);
    topFacts = scoredFacts.slice(0, 15);
  }

  // Step 4: Fetch sources for citations
  const sourceIds = topFacts
    .map((f) => f.fact.citationSourceId)
    .filter((id): id is string => id !== null);

  const sources = sourceIds.length > 0
    ? await db
        .select()
        .from(comparisonSources)
        .where(inArray(comparisonSources.id, sourceIds))
    : [];

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // Step 5: Build grounded prompt
  const factContext = topFacts
    .map((f, i) => {
      const source = f.fact.citationSourceId
        ? sourceMap.get(f.fact.citationSourceId)
        : null;
      return `[${i + 1}] ${f.fact.value} (confidence: ${f.fact.confidence}, similarity: ${f.similarity.toFixed(3)})${source ? ` Source: ${source.title} (${source.url})` : ""}`;
    })
    .join("\n");

  const messages = [
    {
      role: "system" as const,
      content: `You are SideBy, a factual research assistant. Answer the user's question using ONLY the provided facts.

Rules:
1. If the facts directly answer the question → answer confidently with citations [1], [2], etc.
2. If the facts partially answer → answer with what you have, label as "inference", and note gaps.
3. If the facts don't answer at all → say "I don't have enough information to answer this" and set type to "insufficient".
4. Never hallucinate. Never use outside knowledge.
5. Every claim must cite a fact number or be labeled as inference.

Return valid JSON only with this structure:
{
  "answer": "your answer text with [citations]",
  "citations": ["1", "3"],
  "confidence": 0.85,
  "type": "grounded" | "inference" | "insufficient"
}`,
    },
    {
      role: "user" as const,
      content: `Question: ${question}\n\nFacts:\n${factContext}\n\nAnswer the question using only these facts.`,
    },
  ];

  // Step 6: Generate answer
  const provider = getPrimaryProvider();
  const result = await provider.generateObject(messages, FollowUpSchema, {
    maxTokens: 2000,
    temperature: 0.2,
  });

  // Step 7: Store in comparison_questions
  await db.insert(comparisonQuestions).values({
    comparisonId,
    question,
    answer: result.data.answer,
    groundedIn: result.data.type,
    answeredAt: new Date(),
  });

  logger.info("Follow-up answered", {
    comparisonId,
    question: question.slice(0, 100),
    type: result.data.type,
    confidence: result.data.confidence,
    factsUsed: topFacts.length,
  });

  return {
    question,
    answer: result.data.answer,
    citations: result.data.citations,
    confidence: result.data.confidence,
    type: result.data.type,
    factsUsed: topFacts.length,
    answeredAt: new Date().toISOString(),
  };
}
