import { describe, expect, it } from "vitest";
import { shouldAcceptTechnicalMismatch } from "../comparison-validator.js";
import type { ComparisonIntent } from "../../../src/lib/comparisonTaxonomy.js";

const technicalIntent: ComparisonIntent = {
  category: "software",
  label: "Software",
  status: "ready",
  canStart: true,
  safetyLevel: "standard",
  confidence: 0.9,
  entityA: "Astra",
  entityB: "Astro",
  message: "Ready as software.",
  sourceRequirements: [],
  signals: [],
};

const aiMismatch = {
  comparable: false,
  relation: "unrelated" as const,
  category: "general_research" as const,
  confidence: 0.8,
  sameEntity: false,
  entityResolutionConfidence: 0.8,
  canonicalEntity: null,
  reason: "Names are similar.",
  suggestedQuery: null,
};

describe("comparison validator technical mismatch recovery", () => {
  it("keeps concrete technical projects comparable when the model over-indexes on similar names", () => {
    expect(shouldAcceptTechnicalMismatch(technicalIntent, aiMismatch)).toBe(true);
  });

  it("never overrides a deterministic policy block", () => {
    expect(shouldAcceptTechnicalMismatch({
      ...technicalIntent,
      signals: [{
        id: "political-subject",
        label: "Political subject",
        message: "Blocked",
        severity: "block",
      }],
    }, aiMismatch)).toBe(false);
  });
});
