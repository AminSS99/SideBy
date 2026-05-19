/**
 * Follow-up AI Engine with Vector Search Retrieval
 * Answers questions grounded in stored comparison facts.
 */
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import {
  comparisons,
  comparisonSources,
  comparisonFacts,
  comparisonQuestions,
} from "../../src/db/schema.js";
import { canAccessComparison } from "./db-auth.js";
import { getPrimaryProvider } from "./providers/index.js";
import { logger } from "./log.js";
import { embedText, toVectorLiteral } from "./embeddings.js";
import { sanitizeLlmStringArray, sanitizeLlmText } from "./sanitize.js";

const FollowUpSchema = z.object({
  answer: z.string().max(6000).transform((value) => sanitizeLlmText(value, 6000)),
  citations: z.array(z.string().max(40)).transform((values) => sanitizeLlmStringArray(values, 40)),
  confidence: z.number().min(0).max(1),
  type: z.enum(["grounded", "inference", "insufficient"]),
});

type FactRow = typeof comparisonFacts.$inferSelect;

type RetrievedFact = {
  fact: Pick<
    FactRow,
    | "id"
    | "sourceId"
    | "entity"
    | "category"
    | "label"
    | "value"
    | "confidence"
  >;
  similarity: number;
};

type FactSearchRow = {
  id: string;
  source_id: string | null;
  entity: string;
  category: string;
  label: string | null;
  value: string;
  confidence: string | number;
  similarity: number | string;
};

function getExecuteRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

function keywordTopFacts(facts: FactRow[], question: string): RetrievedFact[] {
  const questionWords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const scoredFacts = facts.map((fact) => {
    const text = `${fact.entity || ""} ${fact.category || ""} ${fact.label || ""} ${fact.value || ""}`.toLowerCase();
    const matches = questionWords.filter((word) => text.includes(word)).length;
    return { fact, similarity: matches / Math.max(questionWords.length, 1) };
  });

  scoredFacts.sort((a, b) => b.similarity - a.similarity);
  return scoredFacts.slice(0, 15);
}

async function vectorTopFacts(
  db: ReturnType<typeof createDbClient>,
  comparisonId: string,
  question: string,
): Promise<RetrievedFact[]> {
  try {
    const queryEmbedding = await embedText(question);
    const vectorLiteral = toVectorLiteral(queryEmbedding);
    const result = await db.execute(sql<FactSearchRow>`
      select
        cf.id,
        cf.source_id,
        cf.entity,
        cf.category,
        cf.label,
        cf.value,
        cf.confidence,
        (1 - (cf.embedding <=> ${vectorLiteral}::vector))::float as similarity
      from comparison_facts cf
      where cf.comparison_id = ${comparisonId}
        and cf.embedding is not null
      order by cf.embedding <=> ${vectorLiteral}::vector
      limit 15
    `);

    return getExecuteRows<FactSearchRow>(result).map((row) => ({
      fact: {
        id: row.id,
        sourceId: row.source_id,
        entity: row.entity,
        category: row.category,
        label: row.label,
        value: row.value,
        confidence: String(row.confidence),
      },
      similarity: Number(row.similarity),
    }));
  } catch (error) {
    logger.warn("Vector follow-up retrieval failed; falling back to keyword retrieval", {
      comparisonId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

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

  // Step 1: Fetch all facts for this comparison
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

  // Step 2: Find top-K relevant facts with pgvector, falling back to keywords
  // for older comparisons that do not have stored fact embeddings yet.
  const vectorFacts = await vectorTopFacts(db, comparisonId, question);
  const topFacts = vectorFacts.length > 0 ? vectorFacts : keywordTopFacts(facts, question);

  // Step 3: Fetch sources for citations
  const sourceIds = topFacts
    .map((f) => f.fact.sourceId)
    .filter((id): id is string => id !== null);

  const sources = sourceIds.length > 0
    ? await db
        .select()
        .from(comparisonSources)
        .where(inArray(comparisonSources.id, sourceIds))
    : [];

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // Step 4: Build grounded prompt
  const factContext = topFacts
    .map((f, i) => {
      const source = f.fact.sourceId
        ? sourceMap.get(f.fact.sourceId)
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

  // Step 5: Generate answer
  const provider = getPrimaryProvider();
  const result = await provider.generateObject(messages, FollowUpSchema, {
    maxTokens: 2000,
    temperature: 0.2,
  });

  // Step 6: Store in comparison_questions
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

  const citedFactIndexes = new Set(
    result.data.citations
      .map((citation) => Number(citation.replace(/\D/g, "")) - 1)
      .filter((index) => Number.isInteger(index) && index >= 0),
  );
  const evidenceFacts = topFacts
    .filter((_, index) =>
      citedFactIndexes.size > 0 ? citedFactIndexes.has(index) : index < 5,
    )
    .slice(0, 6);

  return {
    question,
    answer: result.data.answer,
    citations: result.data.citations,
    confidence: result.data.confidence,
    type: result.data.type,
    factsUsed: topFacts.length,
    evidence: evidenceFacts.map((item) => {
      const source = item.fact.sourceId
        ? sourceMap.get(item.fact.sourceId)
        : null;
      return {
        id: item.fact.id,
        label: item.fact.label || "Supporting fact",
        value: item.fact.value || "",
        confidence: Number(item.fact.confidence || 0),
        similarity: item.similarity,
        sourceTitle: source?.title || null,
        sourceUrl: source?.url || null,
      };
    }),
    answeredAt: new Date().toISOString(),
  };
}
