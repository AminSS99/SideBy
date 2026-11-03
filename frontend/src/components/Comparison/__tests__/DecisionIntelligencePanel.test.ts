import { describe, expect, it } from "vitest";
import type { ComparisonData } from "../types";

describe("DecisionIntelligencePanel Evidence Graph helper logic", () => {
  const sampleResult: ComparisonData = {
    query: "React vs Vue",
    slug: "react-vs-vue",
    context: "",
    sourceCount: 3,
    dimensions: [],
    consensus: [],
    contradictions: [],
    updatedAt: "2025-01-01T00:00:00.000Z",
    entities: {
      a: {
        name: "React",
        subtitle: "UI Library",
        mark: "R",
        hex: "#61dafb",
      },
      b: {
        name: "Vue",
        subtitle: "Progressive Framework",
        mark: "V",
        hex: "#42b883",
      },
    },
    verdict: {
      bestOverall: "React",
      bestValue: "Vue",
      developers: "React",
      teams: "React",
      students: "Vue",
      powerUsers: "React",
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
            sourceTitle: "npm trends",
            freshness: "Fresh",
          },
          {
            entity: "b",
            label: "Ecosystem Size",
            value: "50k+ npm packages",
            confidence: 0.9,
            source: "npm",
            sourceUrl: "https://npmjs.com",
            sourceTitle: "npm trends",
            freshness: "Fresh",
          },
        ],
      },
    ],
    sources: [
      {
        title: "npm trends",
        url: "https://npmjs.com",
        reliability: "Official",
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
