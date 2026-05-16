import {
  analyzeComparisonQuery,
  type ComparisonCategory,
  type ComparisonIntentStatus,
  type SafetyLevel,
} from "./comparisonTaxonomy.js";

export type QueryIntentStatus = ComparisonIntentStatus;

export type QueryIntent = {
  status: QueryIntentStatus;
  canStart: boolean;
  confidence: number;
  entityA: string | null;
  entityB: string | null;
  category: ComparisonCategory | null;
  categoryLabel?: string;
  safetyLevel?: SafetyLevel;
  message: string;
  suggestion?: string;
  disclaimer?: string;
  policyNote?: string;
};

export const analyzeQueryIntent = (rawQuery: string): QueryIntent => {
  const intent = analyzeComparisonQuery(rawQuery);

  return {
    status: intent.status,
    canStart: intent.canStart,
    confidence: intent.confidence,
    entityA: intent.entityA,
    entityB: intent.entityB,
    category: intent.category,
    categoryLabel: intent.label,
    safetyLevel: intent.safetyLevel,
    message: intent.message,
    suggestion: intent.suggestion,
    disclaimer: intent.disclaimer,
    policyNote: intent.policyNote,
  };
};
