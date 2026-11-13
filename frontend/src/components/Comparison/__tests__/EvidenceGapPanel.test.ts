// @vitest-environment node
/**
 * AUTHORED BUT NOT EXECUTED — deferred-testing batch (LAUNCH-01).
 * Do not claim these pass. Run with:
 *   pnpm exec vitest run src/components/Comparison/__tests__/EvidenceGapPanel.test.ts
 *
 * Evidence gap derivation contract:
 * Gaps are derived directly from the comparison's evidence record:
 * - "missing-both": category has 0 facts for both options
 * - "missing": category has facts for one option but 0 for the other (one-sided)
 * - "uncited": facts that lack a retrievable sourceUrl
 * - "weak": facts with support score < 0.6 (clarifying support score != probability)
 * - "contradiction": conflicting claims recorded in result.contradictions
 */
import { describe, it, expect } from "vitest";
import { deriveEvidenceGaps } from "../evidenceGaps";
import type { ComparisonData } from "../types";

const baseComparison: ComparisonData = {
  slug: "react-vs-vue",
  query: "React vs Vue",
  context: "Frontend framework comparison",
  entities: {
    a: { name: "React", subtitle: "Library", mark: "R", hex: "#61dafb" },
    b: { name: "Vue", subtitle: "Framework", mark: "V", hex: "#42b883" },
  },
  dimensions: [{ subject: "Performance", a: 80, b: 85, fullMark: 100 }],
  consensus: ["Both are popular frontend choices."],
  contradictions: [],
  categories: [],
  sources: [
    { title: "React Docs", url: "https://react.dev", reliability: "Official", fetchedAt: "2026-10-30" },
    { title: "Vue Docs", url: "https://vuejs.org", reliability: "Official", fetchedAt: "2026-10-30" },
  ],
  verdict: {
    bestOverall: "React",
    bestValue: "Vue",
    developers: "React",
    teams: "Vue",
    students: "Vue",
    powerUsers: "React",
    summary: "Both are capable choices with distinct architectures.",
  },
  sourceCount: 2,
  updatedAt: "2026-10-30T12:00:00.000Z",
};

describe("deriveEvidenceGaps", () => {
  it("derives missing-both gap when a category has 0 facts for either option", () => {
    const data: ComparisonData = {
      ...baseComparison,
      categories: [
        {
          name: "Security",
          winner: "tie",
          verdict: "No data available.",
          facts: [],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe("missing-both");
    expect(gaps[0].title).toContain("Security");
    expect(gaps[0].detail).toContain("React");
    expect(gaps[0].detail).toContain("Vue");
    expect(gaps[0].question).toContain("Security");
  });

  it("derives missing gap when a category is one-sided (facts for A but 0 for B)", () => {
    const data: ComparisonData = {
      ...baseComparison,
      categories: [
        {
          name: "Ecosystem",
          winner: "a",
          verdict: "React has broad ecosystem support.",
          facts: [
            {
              entity: "a",
              label: "Component libraries",
              value: "Large selection",
              source: "React Docs",
              sourceUrl: "https://react.dev/ecosystem",
              sourceTitle: "Ecosystem",
              confidence: 0.9,
              freshness: "Stable",
            },
          ],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe("missing");
    expect(gaps[0].title).toContain("Vue");
    expect(gaps[0].detail).toContain("one-sided");
    expect(gaps[0].question).toContain("Vue on Ecosystem");
  });

  it("derives missing gap when a category has facts for B but 0 for A", () => {
    const data: ComparisonData = {
      ...baseComparison,
      categories: [
        {
          name: "Template Syntax",
          winner: "b",
          verdict: "Vue provides built-in directives.",
          facts: [
            {
              entity: "b",
              label: "Directives",
              value: "v-if, v-for built-in",
              source: "Vue Docs",
              sourceUrl: "https://vuejs.org/guide",
              sourceTitle: "Guide",
              confidence: 0.95,
              freshness: "Stable",
            },
          ],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe("missing");
    expect(gaps[0].title).toContain("React");
    expect(gaps[0].detail).toContain("one-sided");
  });

  it("derives uncited gap when claims lack a retrievable sourceUrl", () => {
    const data: ComparisonData = {
      ...baseComparison,
      categories: [
        {
          name: "Performance",
          winner: "tie",
          verdict: "Comparable rendering speed.",
          facts: [
            {
              entity: "a",
              label: "Virtual DOM overhead",
              value: "Minimal in v18",
              source: "Uncited Blog",
              sourceUrl: "", // missing citation
              sourceTitle: "",
              confidence: 0.8,
              freshness: "Monitor",
            },
            {
              entity: "b",
              label: "Reactivity tracking",
              value: "Fine-grained proxy",
              source: "Vue Docs",
              sourceUrl: "https://vuejs.org/reactivity",
              sourceTitle: "Reactivity",
              confidence: 0.9,
              freshness: "Stable",
            },
          ],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe("uncited");
    expect(gaps[0].detail).toContain("assertions, not evidence");
    expect(gaps[0].question).toContain("lack citations");
  });

  it("derives weak gap when facts have confidence < 0.6", () => {
    const data: ComparisonData = {
      ...baseComparison,
      categories: [
        {
          name: "Enterprise Adoption",
          winner: "a",
          verdict: "Claimed enterprise preference.",
          facts: [
            {
              entity: "a",
              label: "Fortune 500 share",
              value: "Estimated majority",
              source: "Forum comment",
              sourceUrl: "https://example.com/forum",
              sourceTitle: "Forum",
              confidence: 0.45, // low confidence (< 0.6)
              freshness: "Monitor",
            },
            {
              entity: "b",
              label: "EU Enterprise share",
              value: "Growing presence",
              source: "Vue Docs",
              sourceUrl: "https://vuejs.org/stories",
              sourceTitle: "Stories",
              confidence: 0.85,
              freshness: "Stable",
            },
          ],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe("weak");
    expect(gaps[0].detail).toContain("pipeline's support score");
    expect(gaps[0].detail).toContain("not a probability of being right");
  });

  it("derives contradiction gap from recorded contradictions", () => {
    const data: ComparisonData = {
      ...baseComparison,
      contradictions: ["Benchmark A claims React is 15% faster; Benchmark B claims Vue is 10% faster."],
      categories: [
        {
          name: "Benchmarks",
          winner: "tie",
          verdict: "Conflicting metrics.",
          facts: [
            {
              entity: "a",
              label: "Speed",
              value: "Fast",
              source: "A",
              sourceUrl: "https://a.com",
              sourceTitle: "A",
              confidence: 0.8,
              freshness: "Stable",
            },
            {
              entity: "b",
              label: "Speed",
              value: "Fast",
              source: "B",
              sourceUrl: "https://b.com",
              sourceTitle: "B",
              confidence: 0.8,
              freshness: "Stable",
            },
          ],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe("contradiction");
    expect(gaps[0].title).toBe("Sources disagree");
    expect(gaps[0].detail).toContain("Benchmark A");
    expect(gaps[0].question).toContain("reconcile this conflicting evidence");
  });

  it("returns zero gaps when both sides have cited, high-confidence evidence with no contradictions", () => {
    const data: ComparisonData = {
      ...baseComparison,
      contradictions: [],
      categories: [
        {
          name: "Documentation Quality",
          winner: "tie",
          verdict: "Both options have comprehensive official documentation.",
          facts: [
            {
              entity: "a",
              label: "Tutorials",
              value: "Official interactive tutorial",
              source: "React Docs",
              sourceUrl: "https://react.dev/learn",
              sourceTitle: "Learn React",
              confidence: 0.95,
              freshness: "Stable",
            },
            {
              entity: "b",
              label: "Tutorials",
              value: "Official tutorial with playground",
              source: "Vue Docs",
              sourceUrl: "https://vuejs.org/tutorial",
              sourceTitle: "Vue Tutorial",
              confidence: 0.95,
              freshness: "Stable",
            },
          ],
        },
      ],
    };

    const gaps = deriveEvidenceGaps(data);
    expect(gaps).toHaveLength(0);
  });
});
