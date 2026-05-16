/**
 * Query Normalizer
 *
 * Canonicalizes entity pairs for reuse and stores the shared SideBy taxonomy
 * classification alongside analytics.
 */
import {
  analyzeComparisonQuery,
  extractComparisonEntities,
  type ComparisonCategory,
  type ComparisonIntentStatus,
  type SafetyLevel,
} from "../../src/lib/comparisonTaxonomy.js";

export type QueryCategory = ComparisonCategory;

export type NormalizedQuery = {
  rawQuery: string;
  normalizedQuery: string;
  canonicalSlug: string;
  entityA: string;
  entityB: string;
  category: QueryCategory;
  taxonomyStatus: ComparisonIntentStatus;
  safetyLevel: SafetyLevel;
  confidence: number;
  isVague: boolean;
  suggestedQuery?: string;
  policyNote?: string;
  disclaimer?: string;
  sourceRequirements: string[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9\s+./&'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function canonicalEntityOrder(a: string, b: string): [string, string] {
  const an = normalize(a);
  const bn = normalize(b);
  return an <= bn ? [a, b] : [b, a];
}

export function normalizeQuery(rawQuery: string): NormalizedQuery {
  const intent = analyzeComparisonQuery(rawQuery);
  const extracted = extractComparisonEntities(rawQuery);
  const entityA = normalize(intent.entityA || extracted.entityA || "unknown");
  const entityB = normalize(intent.entityB || extracted.entityB || "unknown");
  const [canonA, canonB] = canonicalEntityOrder(entityA, entityB);

  const result: NormalizedQuery = {
    rawQuery,
    normalizedQuery: normalize(rawQuery),
    canonicalSlug: slugify(`${canonA}-vs-${canonB}`),
    entityA: canonA,
    entityB: canonB,
    category: intent.category,
    taxonomyStatus: intent.status,
    safetyLevel: intent.safetyLevel,
    confidence: intent.confidence,
    isVague: intent.status === "needs_entities" || intent.status === "needs_context",
    suggestedQuery: intent.suggestion,
    policyNote: intent.policyNote,
    disclaimer: intent.disclaimer,
    sourceRequirements: intent.sourceRequirements,
  };

  return result;
}

export function buildDetectedEntitiesMeta(entities: Array<{ name: string; type?: string }>): string {
  return JSON.stringify(entities.map((e) => ({
    name: e.name.toLowerCase(),
    type: e.type || null,
  })));
}

export async function findExistingByCanonicalSlug(
  db: ReturnType<typeof import("../../src/db/index.js").createDbClient>,
  canonicalSlug: string,
): Promise<string | null> {
  const { comparisons } = await import("../../src/db/schema.js");
  const { eq, like } = await import("drizzle-orm");

  const rows = await db
    .select({ id: comparisons.id })
    .from(comparisons)
    .where(eq(comparisons.slug, canonicalSlug))
    .limit(1);

  if (rows[0]?.id) return rows[0].id;

  const fuzzyRows = await db
    .select({ id: comparisons.id })
    .from(comparisons)
    .where(like(comparisons.slug, `${canonicalSlug}%`))
    .limit(1);

  return fuzzyRows[0]?.id || null;
}
