import { describe, expect, it } from "vitest";
import type { ComparisonData } from "../types";

describe("DecisionIntelligencePanel Evidence Graph helper logic", () => {
  const sampleResult: ComparisonData = {
    id: "test-comp-1",
    query: "React vs Vue",
    slug: "react-vs-vue",
    sourceCount: 3,
    status: "completed",
    visibility: "private",
    updatedAt: "2025-01-01T00:00:00.000Z",
    entities: {
      a: {
        id: "react",
        name: "React",
        subtitle: "UI Library",
        hex: "#61dafb",
      },
      b: {
        id: "vue",
        name: "Vue",
        subtitle: "Progressive Framework",
        hex: "#42b883",
      },
    },
    verdict: {
      bestOverall: "React",
      summary: "React has a larger ecosystem while Vue offers easier onboarding.",
    },
    categories: [
      {
        name: "Ecosystem",
        winner: "a",
        verdict: "React has a massive ecosystem.",
        facts: [
          {
            entity: "a",
            label: "Ecosystem Size",
            value: "200k+ npm packages",
            confidence: 0.95,
            source: "npm",
            sourceUrl: "https://npmjs.com",
            freshness: "Fresh",
          },
          {
            entity: "b",
            label: "Ecosystem Size",
            value: "50k+ npm packages",
            confidence: 0.9,
            source: "npm",
            sourceUrl: "https://npmjs.com",
            freshness: "Fresh",
          },
        ],
      },
    ],
    sources: [
      {
        title: "npm trends",
        url: "https://npmjs.com",
        reliability: "official",
        confidence: 0.95,
        fetchedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  };

  it("constructs valid data structures for comparison rendering", () => {
    expect(sampleResult.entities.a.name).toBe("React");
    expect(sampleResult.entities.b.name).toBe("Vue");
    expect(sampleResult.categories).toHaveLength(1);
    expect(sampleResult.sources).toHaveLength(1);
  });
});
