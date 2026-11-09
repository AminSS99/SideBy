/**
 * AUTHORED BUT UNEXECUTED — deferred testing instruction (EXPERIENCE-01).
 * Do not run these tests until validation is explicitly authorized by coordinator.
 *
 * Covers:
 * 1. Strict boundary validation of AdaptivePresentationSpec.
 * 2. Rejection of unknown modules, script injections, and malformed fields.
 * 3. Archetype classification across software, hardware, and general domains.
 * 4. Rules-based presentation planner output guarantees.
 */

import { describe, it, expect } from "vitest";
import {
  PRESENTATION_SPEC_VERSION,
  validatePresentationSpec,
  validateModuleDataReferences,
  getScopedCategories,
  getScopedDimensions,
  getScopedSources,
  inferComparisonArchetype,
  planAdaptivePresentation,
  type AdaptivePresentationSpec,
} from "../presentation-spec";
import type { ComparisonData } from "@/components/Comparison/types";

const mockComparisonSoftware: ComparisonData = {
  slug: "nextjs-vs-remix",
  query: "Next.js vs Remix for Production Web Apps",
  context: "Evaluating React frameworks for modern web apps",
  entities: {
    a: { name: "Next.js", subtitle: "React Framework", mark: "N", hex: "#000000" },
    b: { name: "Remix", subtitle: "Full-stack Framework", mark: "R", hex: "#3992ff" },
  },
  sourceCount: 4,
  updatedAt: "2026-10-31T12:00:00Z",
  verdict: {
    bestOverall: "Next.js",
    bestValue: "Remix",
    developers: "Remix for standard web APIs",
    teams: "Next.js for large ecosystem",
    students: "Remix",
    powerUsers: "Next.js",
    summary: "Next.js provides massive ecosystem breadth; Remix provides clean standard Web Fetch APIs.",
  },
  dimensions: [
    { subject: "Data Fetching", a: 88, b: 92, fullMark: 100 },
    { subject: "Developer Experience", a: 95, b: 84, fullMark: 100 },
    { subject: "Ecosystem & Hosting", a: 96, b: 78, fullMark: 100 },
  ],
  categories: [
    {
      name: "Architecture",
      winner: "b",
      verdict: "Remix adheres directly to web standards.",
      facts: [
        {
          entity: "a",
          label: "Server Components",
          value: "Native React Server Components architecture",
          source: "Next.js Docs",
          sourceUrl: "https://nextjs.org/docs",
          sourceTitle: "Next.js Documentation",
          confidence: 0.95,
          freshness: "Stable",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Next.js Documentation",
      url: "https://nextjs.org/docs",
      reliability: "Official",
      fetchedAt: "2026-10-30",
    },
  ],
  consensus: ["Both support SSR and edge execution."],
  contradictions: ["Debate on RSC mental model complexity."],
};

const mockComparisonDevice: ComparisonData = {
  slug: "iphone-16-pro-vs-pixel-9-pro",
  query: "iPhone 16 Pro vs Pixel 9 Pro Camera and Battery",
  context: "Flagship smartphone comparison",
  entities: {
    a: { name: "iPhone 16 Pro", subtitle: "Apple Flagship", mark: "iP", hex: "#555555" },
    b: { name: "Pixel 9 Pro", subtitle: "Google Flagship", mark: "Px", hex: "#4285f4" },
  },
  sourceCount: 5,
  updatedAt: "2026-10-31T12:00:00Z",
  verdict: {
    bestOverall: "iPhone 16 Pro",
    bestValue: "Pixel 9 Pro",
    developers: "Pixel 9 Pro",
    teams: "iPhone 16 Pro",
    students: "Pixel 9 Pro",
    powerUsers: "iPhone 16 Pro",
    summary: "iPhone leads on video capture and raw battery endurance; Pixel leads on still photography AI.",
  },
  dimensions: [
    { subject: "Battery Endurance", a: 92, b: 85, fullMark: 100 },
    { subject: "Camera Hardware", a: 94, b: 95, fullMark: 100 },
    { subject: "Display Fidelity", a: 91, b: 93, fullMark: 100 },
  ],
  categories: [
    {
      name: "Hardware",
      winner: "a",
      verdict: "A18 Pro delivers superior sustained performance.",
      facts: [
        {
          entity: "a",
          label: "Battery Capacity",
          value: "3582 mAh with 27-hour video playback rating",
          source: "Apple Specs",
          sourceUrl: "https://apple.com/iphone-16-pro/specs",
          sourceTitle: "iPhone 16 Pro Technical Specifications",
          confidence: 0.98,
          freshness: "Stable",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Apple Technical Specifications",
      url: "https://apple.com/iphone-16-pro/specs",
      reliability: "Official",
      fetchedAt: "2026-10-30",
    },
  ],
  consensus: ["Both feature 120Hz LTPO OLED displays."],
  contradictions: [],
};

describe("AdaptivePresentationSpec boundary validation", () => {
  it("validates a compliant rules-planned presentation specification", () => {
    const spec = planAdaptivePresentation(mockComparisonSoftware);
    const validated = validatePresentationSpec(spec);

    expect(validated).not.toBeNull();
    expect(validated?.version).toBe(PRESENTATION_SPEC_VERSION);
    expect(validated?.archetype).toBe("software-services");
    expect(validated?.modules.length).toBeGreaterThan(0);
    expect(validated?.supportedInteractions).toContain("adjust-weights");
    expect(validated?.supportedInteractions).toContain("simulate-flips");
  });

  it("fails closed on unknown or injected module types", () => {
    const malformed = {
      version: PRESENTATION_SPEC_VERSION,
      archetype: "software-services",
      archetypeLabel: "Software",
      tagline: "Test",
      visualEmphasis: {
        primaryFacet: "architecture",
        badgeText: "Software",
        badgeTone: "indigo",
        highlightDimensionKeys: [],
      },
      modules: [
        {
          id: "evil-mod",
          type: "malicious-script-exec", // Invalid module
          priority: 1,
          defaultExpanded: true,
          dataReferences: {},
        },
      ],
      supportedInteractions: ["adjust-weights"],
      metadata: {
        generatedAt: new Date().toISOString(),
        planner: "rules-v1",
        confidence: 0.9,
      },
    };

    const validated = validatePresentationSpec(malformed);
    expect(validated).toBeNull();
  });

  it("fails closed on unknown root properties (strict rejection of executable code or HTML)", () => {
    const spec = planAdaptivePresentation(mockComparisonSoftware);
    const withInjectedCode = {
      ...spec,
      injectedCode: "alert('pwned')",
      customHtml: "<script>window.location='evil.com'</script>",
    };

    const validated = validatePresentationSpec(withInjectedCode);
    expect(validated).toBeNull();
  });
});

describe("Archetype Inference & Planning", () => {
  it("classifies web frameworks, databases, and APIs as software-services", () => {
    const result = inferComparisonArchetype(mockComparisonSoftware);
    expect(result.archetype).toBe("software-services");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);

    const spec = planAdaptivePresentation(mockComparisonSoftware);
    expect(spec.visualEmphasis.primaryFacet).toBe("architecture");
    expect(spec.visualEmphasis.badgeTone).toBe("indigo");
    expect(spec.modules.some((m) => m.type === "tradeoff-tuning")).toBe(true);
    expect(spec.modules.some((m) => m.type === "outcome-simulator")).toBe(true);
  });

  it("classifies phones, laptops, and cameras as products-devices", () => {
    const result = inferComparisonArchetype(mockComparisonDevice);
    expect(result.archetype).toBe("products-devices");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);

    const spec = planAdaptivePresentation(mockComparisonDevice);
    expect(spec.visualEmphasis.primaryFacet).toBe("specifications");
    expect(spec.visualEmphasis.badgeTone).toBe("emerald");
    expect(spec.modules.some((m) => m.type === "spec-matrix")).toBe(true);
  });

  it("falls back to general archetype for non-technical or multi-criteria queries", () => {
    const generalComparison: ComparisonData = {
      ...mockComparisonSoftware,
      slug: "living-in-london-vs-tokyo",
      query: "Living in London vs Tokyo for Expatriates",
      context: "City comparison",
      entities: {
        a: { name: "London", subtitle: "UK Capital", mark: "L", hex: "#000000" },
        b: { name: "Tokyo", subtitle: "Japan Capital", mark: "T", hex: "#ff0000" },
      },
      dimensions: [
        { subject: "Cost of Living", a: 60, b: 75, fullMark: 100 },
        { subject: "Transit & Infrastructure", a: 78, b: 98, fullMark: 100 },
      ],
    };

    const result = inferComparisonArchetype(generalComparison);
    expect(result.archetype).toBe("general");

    const spec = planAdaptivePresentation(generalComparison);
    expect(spec.archetype).toBe("general");
    expect(spec.visualEmphasis.badgeTone).toBe("amber");
  });

  it("includes AI recommendation summary module across all planned archetypes", () => {
    const specSoftware = planAdaptivePresentation(mockComparisonSoftware);
    const specDevice = planAdaptivePresentation(mockComparisonDevice);

    expect(specSoftware.modules.some((m) => m.type === "recommendation-summary")).toBe(true);
    expect(specDevice.modules.some((m) => m.type === "recommendation-summary")).toBe(true);

    const recMod = specSoftware.modules.find((m) => m.type === "recommendation-summary");
    expect(recMod?.priority).toBe(15);
  });
  it("includes category-deepdive module across all planned archetypes", () => {
    const specSoftware = planAdaptivePresentation(mockComparisonSoftware);
    const specDevice = planAdaptivePresentation(mockComparisonDevice);

    expect(specSoftware.modules.some((m) => m.type === "category-deepdive")).toBe(true);
    expect(specDevice.modules.some((m) => m.type === "category-deepdive")).toBe(true);

    const catMod = specSoftware.modules.find((m) => m.type === "category-deepdive");
    expect(catMod?.priority).toBe(60);
  });
});

describe("validateModuleDataReferences", () => {
  it("validates modules that reference existing categories, dimensions, and sources", () => {
    const validMod = {
      id: "mod-test",
      type: "tradeoff-tuning" as const,
      priority: 20,
      defaultExpanded: true,
      dataReferences: {
        categoryNames: ["Architecture"],
        dimensionSubjects: ["Data Fetching", "Developer Experience"],
        sourceUrls: ["https://nextjs.org/docs"],
      },
    };

    expect(validateModuleDataReferences(validMod, mockComparisonSoftware)).toBe(true);
  });

  it("rejects modules whose references do not match any comparison categories", () => {
    const invalidMod = {
      id: "mod-test-invalid",
      type: "spec-matrix" as const,
      priority: 40,
      defaultExpanded: true,
      dataReferences: {
        categoryNames: ["NonExistentCategory"],
      },
    };

    expect(validateModuleDataReferences(invalidMod, mockComparisonSoftware)).toBe(false);
  });

  it("rejects modules whose source references do not match any comparison sources", () => {
    const invalidMod = {
      id: "mod-test-invalid-source",
      type: "sources-view" as const,
      priority: 80,
      defaultExpanded: true,
      dataReferences: {
        sourceUrls: ["https://unrelated-domain.xyz/unknown"],
      },
    };

    expect(validateModuleDataReferences(invalidMod, mockComparisonSoftware)).toBe(false);
  });
});

describe("Data reference scoping helpers", () => {
  it("scopes categories to only those specified in dataReferences.categoryNames", () => {
    const mod = {
      id: "mod-cat",
      type: "category-deepdive" as const,
      priority: 60,
      defaultExpanded: true,
      dataReferences: {
        categoryNames: ["Architecture"],
      },
    };

    const scoped = getScopedCategories(mod, mockComparisonSoftware);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].name).toBe("Architecture");
  });

  it("returns all categories when dataReferences.categoryNames is undefined or empty", () => {
    const mod = {
      id: "mod-cat-all",
      type: "category-deepdive" as const,
      priority: 60,
      defaultExpanded: true,
      dataReferences: {},
    };

    const scoped = getScopedCategories(mod, mockComparisonSoftware);
    expect(scoped).toHaveLength(mockComparisonSoftware.categories.length);
  });

  it("scopes dimensions to only those specified in dataReferences.dimensionSubjects", () => {
    const mod = {
      id: "mod-dim",
      type: "tradeoff-tuning" as const,
      priority: 20,
      defaultExpanded: true,
      dataReferences: {
        dimensionSubjects: ["Data Fetching"],
      },
    };

    const scoped = getScopedDimensions(mod, mockComparisonSoftware);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].subject).toBe("Data Fetching");
  });

  it("scopes sources to only those specified in dataReferences.sourceUrls", () => {
    const mod = {
      id: "mod-src",
      type: "sources-view" as const,
      priority: 80,
      defaultExpanded: true,
      dataReferences: {
        sourceUrls: ["https://nextjs.org/docs"],
      },
    };

    const scoped = getScopedSources(mod, mockComparisonSoftware);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].url).toBe("https://nextjs.org/docs");
  });
});
