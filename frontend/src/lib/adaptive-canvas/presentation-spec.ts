/**
 * Adaptive Decision Canvas — Presentation Specification Contract (v1)
 *
 * Defines the versioned, typed contract describing how a comparison's factual
 * research is visually arranged, emphasizing relevant archetypes without
 * altering factual findings or scores.
 *
 * SECURITY & PURITY BOUNDARIES:
 * - Specifications contain ONLY component IDs, module orders, and data references.
 * - NEVER contains arbitrary HTML, CSS, or executable JavaScript.
 * - Fully validated with strict Zod schemas at runtime boundaries.
 * - Failed validation or unknown modules gracefully fall back to baseline comparison.
 */

import { z } from "zod";
import type {
  ComparisonData,
  Category,
  ComparisonSource,
} from "@/components/Comparison/types";

export const PRESENTATION_SPEC_VERSION = "adaptive-canvas/v1";

export type ComparisonArchetype = "general" | "software-services" | "products-devices";

export type VisualModuleType =
  | "hero-header"
  | "recommendation-summary"
  | "tradeoff-tuning"
  | "outcome-simulator"
  | "spec-matrix"
  | "radar-overview"
  | "category-deepdive"
  | "evidence-audit"
  | "sources-view"
  | "decision-receipt";

export type SupportedInteraction =
  | "adjust-weights"
  | "explore-tradeoffs"
  | "simulate-flips"
  | "focus-dimension"
  | "inspect-evidence"
  | "record-decision"
  | "reset-weights";

export const VisualEmphasisSchema = z.object({
  primaryFacet: z.enum(["specifications", "architecture", "cost-value", "balanced"]),
  badgeText: z.string().trim().min(1).max(60),
  badgeTone: z.enum(["indigo", "emerald", "amber", "slate"]),
  highlightDimensionKeys: z.array(z.string()).default([]),
}).strict();

export type VisualEmphasis = z.infer<typeof VisualEmphasisSchema>;

export const PresentationModuleConfigSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.enum([
    "hero-header",
    "recommendation-summary",
    "tradeoff-tuning",
    "outcome-simulator",
    "spec-matrix",
    "radar-overview",
    "category-deepdive",
    "evidence-audit",
    "sources-view",
    "decision-receipt",
  ]),
  title: z.string().trim().max(100).optional(),
  description: z.string().trim().max(300).optional(),
  defaultExpanded: z.boolean().default(true),
  priority: z.number().int().min(1).max(100),
  dataReferences: z.object({
    categoryNames: z.array(z.string()).optional(),
    dimensionSubjects: z.array(z.string()).optional(),
    sourceUrls: z.array(z.string()).optional(),
  }).strict().default({}),
}).strict();

export type PresentationModuleConfig = z.infer<typeof PresentationModuleConfigSchema>;

export const AdaptivePresentationSpecSchema = z.object({
  version: z.literal(PRESENTATION_SPEC_VERSION),
  archetype: z.enum(["general", "software-services", "products-devices"]),
  archetypeLabel: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(200),
  visualEmphasis: VisualEmphasisSchema,
  modules: z.array(PresentationModuleConfigSchema).min(1),
  supportedInteractions: z.array(
    z.enum([
      "adjust-weights",
      "explore-tradeoffs",
      "simulate-flips",
      "focus-dimension",
      "inspect-evidence",
      "record-decision",
      "reset-weights",
    ]),
  ).min(1),
  metadata: z.object({
    generatedAt: z.string(),
    planner: z.literal("rules-v1"),
    confidence: z.number().min(0).max(1),
  }).strict(),
}).strict();

export type AdaptivePresentationSpec = z.infer<typeof AdaptivePresentationSpecSchema>;

/**
 * Validate untrusted presentation spec input. Returns null if invalid.
 */
export function validatePresentationSpec(data: unknown): AdaptivePresentationSpec | null {
  const result = AdaptivePresentationSpecSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Identify the comparison archetype using structured taxonomy, queries, and dimension cues.
 */
export function inferComparisonArchetype(comparison: ComparisonData): {
  archetype: ComparisonArchetype;
  confidence: number;
} {
  // 1. Inspect taxonomy if available
  const taxonomyCat = comparison.taxonomy?.category;
  if (taxonomyCat) {
    if (
      taxonomyCat === "software" ||
      taxonomyCat === "developer_tool" ||
      taxonomyCat === "ai_tool" ||
      taxonomyCat === "company_service" ||
      taxonomyCat === "technical_standard"
    ) {
      return { archetype: "software-services", confidence: 0.95 };
    }
    if (taxonomyCat === "product") {
      return { archetype: "products-devices", confidence: 0.95 };
    }
  }

  // 2. Keyword heuristic on query & entity names
  const text = `${comparison.query} ${comparison.entities.a.name} ${comparison.entities.b.name} ${comparison.entities.a.subtitle} ${comparison.entities.b.subtitle}`.toLowerCase();

  const softwareKeywords = [
    "framework", "library", "runtime", "database", "api", "saas", "sdk", "cloud",
    "backend", "frontend", "react", "vue", "next", "remix", "node", "python",
    "golang", "rust", "postgres", "sql", "redis", "docker", "kubernetes", "hosting",
    "deployment", "graphql", "orm", "prisma", "drizzle", "vercel", "aws", "gcp"
  ];

  const productKeywords = [
    "phone", "laptop", "camera", "headphone", "earbuds", "watch", "display", "monitor",
    "macbook", "iphone", "pixel", "galaxy", "thinkpad", "ipad", "tablet", "battery",
    "oled", "sensor", "lens", "hardware", "screen", "keyboard", "mouse", "gpu", "cpu"
  ];

  let softwareScore = 0;
  for (const kw of softwareKeywords) {
    const isMatched = kw.length <= 4 ? new RegExp(`\\b${kw}\\b`, "i").test(text) : text.includes(kw);
    if (isMatched) softwareScore += 1;
  }

  let productScore = 0;
  for (const kw of productKeywords) {
    const isMatched = kw.length <= 4 ? new RegExp(`\\b${kw}\\b`, "i").test(text) : text.includes(kw);
    if (isMatched) productScore += 1;
  }

  // 3. Inspect dimension subjects
  const dimSubjects = comparison.dimensions.map((d) => d.subject.toLowerCase()).join(" ");
  if (dimSubjects.includes("developer") || dimSubjects.includes("ecosystem") || /\bapi\b/i.test(dimSubjects)) {
    softwareScore += 2;
  }
  if (dimSubjects.includes("battery") || dimSubjects.includes("display") || dimSubjects.includes("build") || dimSubjects.includes("hardware")) {
    productScore += 2;
  }

  if (softwareScore > productScore && softwareScore >= 1) {
    return { archetype: "software-services", confidence: Math.min(0.7 + softwareScore * 0.05, 0.95) };
  }
  if (productScore > softwareScore && productScore >= 1) {
    return { archetype: "products-devices", confidence: Math.min(0.7 + productScore * 0.05, 0.95) };
  }

  return { archetype: "general", confidence: 0.85 };
}

/**
 * Rules-Based Presentation Planner (v1)
 *
 * Deterministically constructs an AdaptivePresentationSpec matching the comparison's
 * factual data, picking modules, ordering, and emphasis based on the identified archetype.
 */
export function planAdaptivePresentation(comparison: ComparisonData): AdaptivePresentationSpec {
  const { archetype, confidence } = inferComparisonArchetype(comparison);
  const now = new Date().toISOString();

  const allDimensionSubjects = comparison.dimensions.map((d) => d.subject);
  const allCategoryNames = comparison.categories.map((c) => c.name);
  const allSourceUrls = comparison.sources.map((s) => s.url);

  switch (archetype) {
    case "software-services": {
      const highlightDims = allDimensionSubjects.filter((sub) => {
        const lower = sub.toLowerCase();
        return (
          lower.includes("developer") ||
          lower.includes("performance") ||
          lower.includes("ecosystem") ||
          lower.includes("api") ||
          lower.includes("architecture") ||
          lower.includes("hosting")
        );
      });

      return {
        version: PRESENTATION_SPEC_VERSION,
        archetype: "software-services",
        archetypeLabel: "Software & Cloud Architecture",
        tagline: "Technical trade-off canvas emphasizing developer velocity, ecosystem depth, and runtime characteristics.",
        visualEmphasis: {
          primaryFacet: "architecture",
          badgeText: "Software & Architecture",
          badgeTone: "indigo",
          highlightDimensionKeys: highlightDims.length > 0 ? highlightDims : allDimensionSubjects.slice(0, 3),
        },
        supportedInteractions: [
          "adjust-weights",
          "explore-tradeoffs",
          "simulate-flips",
          "focus-dimension",
          "inspect-evidence",
          "record-decision",
          "reset-weights",
        ],
        modules: [
          {
            id: "mod-hero",
            type: "hero-header",
            title: "Executive Synthesis",
            defaultExpanded: true,
            priority: 10,
            dataReferences: {},
          },
          {
            id: "mod-recommendation",
            type: "recommendation-summary",
            title: "AI Research Verdict & Recommendation",
            defaultExpanded: true,
            priority: 15,
            dataReferences: {},
          },
          {
            id: "mod-tradeoffs",
            type: "tradeoff-tuning",
            title: "Priority & Architecture Weighting",
            description: "Tune developer velocity vs ecosystem weightings with real-time composite score feedback.",
            defaultExpanded: true,
            priority: 20,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-outcome-sim",
            type: "outcome-simulator",
            title: "What Would Change the Recommendation?",
            description: "Explore the exact sensitivity thresholds that would shift the architectural recommendation.",
            defaultExpanded: true,
            priority: 30,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-spec-matrix",
            type: "spec-matrix",
            title: "Technical Capabilities Matrix",
            description: "Side-by-side standard compliance, runtime support, and engineering features.",
            defaultExpanded: true,
            priority: 40,
            dataReferences: { categoryNames: allCategoryNames },
          },
          {
            id: "mod-radar",
            type: "radar-overview",
            title: "Multi-Axis Dimension Map",
            defaultExpanded: true,
            priority: 50,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-categories",
            type: "category-deepdive",
            title: "Attributed Findings & Source Citations",
            defaultExpanded: true,
            priority: 60,
            dataReferences: { categoryNames: allCategoryNames },
          },
          {
            id: "mod-evidence-gap",
            type: "evidence-audit",
            title: "Evidence Reliability & Gap Audit",
            defaultExpanded: false,
            priority: 70,
            dataReferences: {},
          },
          {
            id: "mod-sources",
            type: "sources-view",
            title: "Verified Documentation Sources",
            defaultExpanded: false,
            priority: 80,
            dataReferences: { sourceUrls: allSourceUrls },
          },
          {
            id: "mod-receipt",
            type: "decision-receipt",
            title: "Recorded Decision Audit",
            defaultExpanded: true,
            priority: 90,
            dataReferences: {},
          },
        ],
        metadata: {
          generatedAt: now,
          planner: "rules-v1",
          confidence,
        },
      };
    }

    case "products-devices": {
      const highlightDims = allDimensionSubjects.filter((sub) => {
        const lower = sub.toLowerCase();
        return (
          lower.includes("battery") ||
          lower.includes("display") ||
          lower.includes("build") ||
          lower.includes("hardware") ||
          lower.includes("camera") ||
          lower.includes("price") ||
          lower.includes("value")
        );
      });

      return {
        version: PRESENTATION_SPEC_VERSION,
        archetype: "products-devices",
        archetypeLabel: "Hardware & Device Evaluation",
        tagline: "Physical and hardware trade-off canvas balancing specifications, real-world utility, and build quality.",
        visualEmphasis: {
          primaryFacet: "specifications",
          badgeText: "Hardware & Specifications",
          badgeTone: "emerald",
          highlightDimensionKeys: highlightDims.length > 0 ? highlightDims : allDimensionSubjects.slice(0, 3),
        },
        supportedInteractions: [
          "adjust-weights",
          "explore-tradeoffs",
          "simulate-flips",
          "focus-dimension",
          "inspect-evidence",
          "record-decision",
          "reset-weights",
        ],
        modules: [
          {
            id: "mod-hero",
            type: "hero-header",
            title: "Device Summary",
            defaultExpanded: true,
            priority: 10,
            dataReferences: {},
          },
          {
            id: "mod-recommendation",
            type: "recommendation-summary",
            title: "AI Research Verdict & Recommendation",
            defaultExpanded: true,
            priority: 15,
            dataReferences: {},
          },
          {
            id: "mod-spec-matrix",
            type: "spec-matrix",
            title: "Hardware Specifications Breakdown",
            description: "Direct specification comparison extracted from manufacturer and benchmark documentation.",
            defaultExpanded: true,
            priority: 20,
            dataReferences: { categoryNames: allCategoryNames },
          },
          {
            id: "mod-tradeoffs",
            type: "tradeoff-tuning",
            title: "Personal Usage Priorities",
            description: "Weight battery life, display fidelity, or price-to-value to match your workload.",
            defaultExpanded: true,
            priority: 30,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-outcome-sim",
            type: "outcome-simulator",
            title: "What Would Change the Winner?",
            description: "Discover which spec advantages dominate and where the trade-off tilts.",
            defaultExpanded: true,
            priority: 40,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-radar",
            type: "radar-overview",
            title: "Holistic Device Balance",
            defaultExpanded: true,
            priority: 50,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-categories",
            type: "category-deepdive",
            title: "Detailed Category Evidence",
            defaultExpanded: true,
            priority: 60,
            dataReferences: { categoryNames: allCategoryNames },
          },
          {
            id: "mod-evidence-gap",
            type: "evidence-audit",
            title: "Benchmark & Evidence Integrity",
            defaultExpanded: false,
            priority: 70,
            dataReferences: {},
          },
          {
            id: "mod-sources",
            type: "sources-view",
            title: "Device Documentation & Test Sources",
            defaultExpanded: false,
            priority: 80,
            dataReferences: { sourceUrls: allSourceUrls },
          },
          {
            id: "mod-receipt",
            type: "decision-receipt",
            title: "Decision Record",
            defaultExpanded: true,
            priority: 90,
            dataReferences: {},
          },
        ],
        metadata: {
          generatedAt: now,
          planner: "rules-v1",
          confidence,
        },
      };
    }

    case "general":
    default: {
      return {
        version: PRESENTATION_SPEC_VERSION,
        archetype: "general",
        archetypeLabel: "General Comparison Canvas",
        tagline: "Comprehensive multi-criteria decision canvas synthesizing cited evidence, dimensions, and consensus.",
        visualEmphasis: {
          primaryFacet: "balanced",
          badgeText: "Multi-Criteria Decision",
          badgeTone: "amber",
          highlightDimensionKeys: allDimensionSubjects.slice(0, 3),
        },
        supportedInteractions: [
          "adjust-weights",
          "explore-tradeoffs",
          "simulate-flips",
          "focus-dimension",
          "inspect-evidence",
          "record-decision",
          "reset-weights",
        ],
        modules: [
          {
            id: "mod-hero",
            type: "hero-header",
            title: "Comparison Overview",
            defaultExpanded: true,
            priority: 10,
            dataReferences: {},
          },
          {
            id: "mod-recommendation",
            type: "recommendation-summary",
            title: "AI Research Verdict & Recommendation",
            defaultExpanded: true,
            priority: 15,
            dataReferences: {},
          },
          {
            id: "mod-tradeoffs",
            type: "tradeoff-tuning",
            title: "Priority & Weight Tuning",
            description: "Interactively balance criteria weights with instant composite support index updates.",
            defaultExpanded: true,
            priority: 20,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-outcome-sim",
            type: "outcome-simulator",
            title: "Outcome Sensitivity & Key Drivers",
            description: "Understand the sensitivity of this decision to shifts in personal weightings.",
            defaultExpanded: true,
            priority: 30,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-radar",
            type: "radar-overview",
            title: "Dimension Comparison",
            defaultExpanded: true,
            priority: 40,
            dataReferences: { dimensionSubjects: allDimensionSubjects },
          },
          {
            id: "mod-spec-matrix",
            type: "spec-matrix",
            title: "Side-by-Side Attributes",
            defaultExpanded: true,
            priority: 50,
            dataReferences: { categoryNames: allCategoryNames },
          },
          {
            id: "mod-categories",
            type: "category-deepdive",
            title: "Detailed Category Evidence",
            defaultExpanded: true,
            priority: 60,
            dataReferences: { categoryNames: allCategoryNames },
          },
          {
            id: "mod-evidence-gap",
            type: "evidence-audit",
            title: "Evidence Reliability",
            defaultExpanded: false,
            priority: 70,
            dataReferences: {},
          },
          {
            id: "mod-sources",
            type: "sources-view",
            title: "Retrieved Sources",
            defaultExpanded: false,
            priority: 80,
            dataReferences: { sourceUrls: allSourceUrls },
          },
          {
            id: "mod-receipt",
            type: "decision-receipt",
            title: "Decision Audit",
            defaultExpanded: true,
            priority: 90,
            dataReferences: {},
          },
        ],
        metadata: {
          generatedAt: now,
          planner: "rules-v1",
          confidence,
        },
      };
    }
  }
}

/**
 * Validate that a module's configured dataReferences actually correspond to
 * elements in the comparison record.
 * Prevents rendering orphaned or corrupted references.
 */
export function validateModuleDataReferences(
  module: PresentationModuleConfig,
  comparison: ComparisonData,
): boolean {
  if (module.dataReferences.categoryNames && module.dataReferences.categoryNames.length > 0) {
    const valid = module.dataReferences.categoryNames.some((catName) =>
      comparison.categories.some((c) => c.name === catName)
    );
    if (!valid && comparison.categories.length > 0) return false;
  }

  if (module.dataReferences.dimensionSubjects && module.dataReferences.dimensionSubjects.length > 0) {
    const valid = module.dataReferences.dimensionSubjects.some((subj) =>
      comparison.dimensions.some((d) => d.subject === subj)
    );
    if (!valid && comparison.dimensions.length > 0) return false;
  }

  if (module.dataReferences.sourceUrls && module.dataReferences.sourceUrls.length > 0) {
    const valid = module.dataReferences.sourceUrls.some((url) =>
      comparison.sources.some((s) => s.url === url)
    );
    if (!valid && comparison.sources.length > 0) return false;
  }

  return true;
}

/**
 * Filter comparison categories according to a module's configured dataReferences.
 * If dataReferences.categoryNames is specified and non-empty, only those categories are returned.
 * Otherwise, returns all categories.
 */
export function getScopedCategories(
  module: PresentationModuleConfig,
  comparison: ComparisonData,
): Category[] {
  const allowed = module.dataReferences.categoryNames;
  if (!allowed || allowed.length === 0) {
    return comparison.categories;
  }
  return comparison.categories.filter((cat) => allowed.includes(cat.name));
}

/**
 * Filter comparison dimensions according to a module's configured dataReferences.
 * If dataReferences.dimensionSubjects is specified and non-empty, only those dimensions are returned.
 * Otherwise, returns all dimensions.
 */
export function getScopedDimensions(
  module: PresentationModuleConfig,
  comparison: ComparisonData,
): ComparisonData["dimensions"] {
  const allowed = module.dataReferences.dimensionSubjects;
  if (!allowed || allowed.length === 0) {
    return comparison.dimensions;
  }
  return comparison.dimensions.filter((dim) => allowed.includes(dim.subject));
}

/**
 * Filter comparison sources according to a module's configured dataReferences.
 * If dataReferences.sourceUrls is specified and non-empty, only those sources are returned.
 * Otherwise, returns all sources.
 */
export function getScopedSources(
  module: PresentationModuleConfig,
  comparison: ComparisonData,
): ComparisonSource[] {
  const allowed = module.dataReferences.sourceUrls;
  if (!allowed || allowed.length === 0) {
    return comparison.sources;
  }
  return comparison.sources.filter((src) => allowed.includes(src.url));
}

