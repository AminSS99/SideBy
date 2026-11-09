// @vitest-environment node
/**
 * AUTHORED BUT NOT EXECUTED — WEB-BATCH-03 deferred-testing batch.
 * Do not claim these pass. Run with: pnpm exec vitest run src/lib/__tests__/publicComparison.test.ts
 */
import { describe, it, expect } from "vitest";
import { projectPublicResult, PUBLIC_PROJECTION_VERSION } from "@/lib/publicComparison";

const baseResult = {
  query: "Supabase vs Firebase",
  context: "Private user brief that must never publish",
  telemetry: { estimatedCost: 0.5, models: ["deepseek"] },
  entities: {
    a: { name: "Supabase", subtitle: "Open source", mark: "S", hex: "#3ecf8e" },
    b: { name: "Firebase", subtitle: "Google", mark: "F", hex: "#ffcb2b" },
  },
  dimensions: [{ subject: "Pricing", a: 80, b: 70, fullMark: 100 }],
  consensus: ["Both scale."],
  contradictions: ["Pricing pages disagree on egress."],
  categories: [
    {
      name: "Pricing",
      winner: "a",
      verdict: "Supabase leads.",
      facts: [
        {
          entity: "a",
          label: "Free tier",
          value: "500MB",
          source: "Docs",
          sourceUrl: "https://example.com/a",
          sourceTitle: "Docs",
          confidence: 0.9,
          freshness: "Fresh",
          changed: true,
          previousValue: "stale",
        },
        {
          entity: "b",
          label: "Free tier",
          value: "1GB",
          source: "",
          sourceUrl: "",
          sourceTitle: "",
          confidence: 0.4,
          freshness: "Monitor",
          extractionMethod: "internal",
          contentHash: "abc",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Docs",
      url: "https://example.com/a",
      reliability: "Docs",
      sourceType: "docs",
      fetchedAt: "2026-10-27T00:00:00.000Z",
      confidence: 0.9,
      summary: "Pricing page.",
      extractionMethod: "firecrawl",
      contentHash: "deadbeef",
    },
  ],
  verdict: { bestOverall: "Supabase", summary: "Leads on pricing." },
  provenance: "researched",
  sourceCount: 1,
  updatedAt: "2026-10-27T00:00:00.000Z",
  slug: "supabase-vs-firebase",
};

describe("public projection contract", () => {
  it("exposes the versioned contract id", () => {
    expect(PUBLIC_PROJECTION_VERSION).toBe("public-projection/v2");
  });

  it("preserves fact entity attribution and strips unsafe URLs", () => {
    const projected = projectPublicResult(baseResult);
    expect(projected?.categories[0]?.facts[0]?.entity).toBe("a");
    expect(projected?.categories[0]?.facts[1]?.entity).toBe("b");
    expect(projected?.categories[0]?.facts[1]?.sourceUrl).toBe("");
  });

  it("keeps public fields and drops the private record", () => {
    const projected = projectPublicResult(baseResult);
    expect(projected).not.toBeNull();
    expect(projected?.query).toBe("Supabase vs Firebase");
    expect(projected?.entities.a.name).toBe("Supabase");
    expect(projected?.categories[0]?.facts).toHaveLength(2);
    expect(projected?.sources[0]?.url).toBe("https://example.com/a");
    // Private surface is excluded by policy, not by accident:
    expect(projected).not.toHaveProperty("context");
    expect(projected).not.toHaveProperty("telemetry");
    expect(projected?.sources[0]).not.toHaveProperty("extractionMethod");
    expect(projected?.sources[0]).not.toHaveProperty("contentHash");
    // Presentation fields the public page renders are preserved:
    expect(projected?.entities.a.hex).toBe("#3ecf8e");
    expect(projected?.categories[0]?.facts[0]?.changed).toBe(true);
    expect(projected?.categories[0]?.facts[0]?.previousValue).toBe("stale");
  });

  it("fails safe on unusable payloads instead of partial records", () => {
    expect(projectPublicResult(null)).toBeNull();
    expect(projectPublicResult({})).toBeNull();
    expect(projectPublicResult({ ...baseResult, entities: null })).toBeNull();
    expect(projectPublicResult({ ...baseResult, query: 42 })).toBeNull();
  });
});
