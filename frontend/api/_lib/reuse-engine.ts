/**
 * Reuse Engine — Phase 11: Result Quality + Reuse
 *
 * Combines:
 * 1. Category-aware dimension templates
 * 2. Freshness classification (volatile / medium / stable)
 * 3. Confidence calibration (multi-factor)
 * 4. Entity knowledge base for fact reuse
 */
import {
  getComparisonCategoryDefinition,
  type DimensionTemplate,
} from "../../src/lib/comparisonTaxonomy.js";
import type { QueryCategory } from "./query-normalizer.js";

// ─── Freshness System ────────────────────────────────────────────────────────

export type FreshnessClass = "volatile" | "medium" | "stable";

/** How quickly different categories age */
const freshnessMap: Record<string, FreshnessClass> = {
  software: "volatile",
  developer_tool: "volatile",
  ai_tool: "volatile",
  product: "medium",
  company_service: "medium",
  place: "stable",
  education: "medium",
  career: "medium",
  finance_info: "medium",
  health_fitness: "medium",
  method_framework: "stable",
  technical_standard: "medium",
  general_research: "medium",
  unsupported: "medium",
  sensitive: "medium",
};

/** Max age in days before a comparison should be refreshed */
const freshnessMaxAge: Record<FreshnessClass, number> = {
  volatile: 7,   // AI tools, frameworks change weekly
  medium: 30,     // Backend, databases change monthly
  stable: 180,    // Cities, geography change slowly
};

export function getFreshnessClass(category: QueryCategory): FreshnessClass {
  return freshnessMap[category] || "medium";
}

export function isFreshEnough(
  lastUpdated: Date | string | undefined,
  category: QueryCategory,
): boolean {
  if (!lastUpdated) return false;
  const updated = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const ageDays = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  const maxAge = freshnessMaxAge[getFreshnessClass(category)];
  return ageDays < maxAge;
}

export function isStaleButUsable(
  lastUpdated: Date | string | undefined,
  category: QueryCategory,
): boolean {
  if (!lastUpdated) return false;
  const updated = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const ageDays = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  const maxAge = freshnessMaxAge[getFreshnessClass(category)];
  return ageDays < maxAge * 2;
}

export function freshnessLabel(lastUpdated: Date | string, category: QueryCategory): string {
  const updated = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const ageDays = Math.round((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
  const cl = getFreshnessClass(category);
  if (ageDays < 1) return `Refreshed today (${cl})`;
  if (ageDays < 2) return `Refreshed yesterday (${cl})`;
  return `Refreshed ${ageDays} days ago (${cl})`;
}

// ─── Category-Aware Dimension Templates ──────────────────────────────────────

const dimensionTemplates: Record<string, DimensionTemplate[]> = {
  frontend: [
    { name: "Performance", description: "Bundle size, rendering speed, runtime performance", weight: 1.2 },
    { name: "Developer Experience", description: "Tooling, TypeScript support, hot-reload speed", weight: 1.0 },
    { name: "Ecosystem", description: "Third-party libraries, plugins, community packages", weight: 1.1 },
    { name: "SSR / Rendering", description: "Server-side rendering, static generation, hydration", weight: 0.9 },
    { name: "Hiring Market", description: "Availability of developers, salary expectations", weight: 0.8 },
    { name: "Learning Curve", description: "Time to proficiency, documentation quality", weight: 0.9 },
  ],
  backend: [
    { name: "Performance", description: "Request throughput, cold starts, latency", weight: 1.2 },
    { name: "Pricing", description: "Free tier limits, per-unit costs, scaling cost", weight: 1.1 },
    { name: "Developer Experience", description: "SDK quality, documentation, local dev setup", weight: 1.0 },
    { name: "Ecosystem", description: "Integrations, community packages, tooling", weight: 1.0 },
    { name: "Vendor Lock-in", description: "Portability, open standards compliance", weight: 0.9 },
    { name: "Real-time Capabilities", description: "WebSocket, subscriptions, live queries", weight: 0.8 },
  ],
  database: [
    { name: "Query Flexibility", description: "SQL support, ORM compatibility, migrations", weight: 1.2 },
    { name: "Performance", description: "Query speed, connection pooling, indexing", weight: 1.1 },
    { name: "Pricing", description: "Free tier, per-GB costs, compute pricing", weight: 1.0 },
    { name: "Scalability", description: "Horizontal scaling, read replicas, sharding", weight: 1.0 },
    { name: "Developer Experience", description: "Setup, tooling, branching, local dev", weight: 0.9 },
    { name: "Ecosystem", description: "Drivers, frameworks, community support", weight: 0.8 },
  ],
  hosting: [
    { name: "Performance", description: "CDN edge nodes, build speed, cold starts", weight: 1.2 },
    { name: "Pricing", description: "Bandwidth costs, build minutes, serverless costs", weight: 1.1 },
    { name: "Developer Experience", description: "Deploy workflow, preview URLs, CLI tools", weight: 1.0 },
    { name: "Framework Support", description: "Framework integrations, meta-frameworks", weight: 1.0 },
    { name: "Global Edge Network", description: "CDN coverage, regional routing", weight: 0.9 },
    { name: "Ecosystem", description: "Addons, integrations, marketplace", weight: 0.8 },
  ],
  ai_llm: [
    { name: "Output Quality", description: "Accuracy, reasoning depth, instruction following", weight: 1.3 },
    { name: "Speed", description: "Response latency, streaming, throughput", weight: 1.0 },
    { name: "Pricing", description: "Per-token cost, free tier limits, volume pricing", weight: 1.1 },
    { name: "Context Window", description: "Max input tokens, retrieval capabilities", weight: 0.9 },
    { name: "Multimodal Support", description: "Image, audio, video understanding", weight: 0.8 },
    { name: "Ecosystem", description: "API integrations, plugins, developer tools", weight: 0.8 },
  ],
  laptop: [
    { name: "Performance", description: "CPU/GPU benchmarks, real-world workflows", weight: 1.2 },
    { name: "Battery Life", description: "Real-world battery duration, charging speed", weight: 1.1 },
    { name: "Build Quality", description: "Materials, keyboard, trackpad, durability", weight: 1.0 },
    { name: "Display Quality", description: "Resolution, color accuracy, brightness, refresh rate", weight: 0.9 },
    { name: "Portability", description: "Weight, thickness, charger size", weight: 0.9 },
    { name: "Repairability", description: "Upgrade options, spare parts, iFixit score", weight: 0.8 },
  ],
  phone: [
    { name: "Performance", description: "Processing power, GPU, RAM management", weight: 1.1 },
    { name: "Camera System", description: "Photo/video quality, low-light, zoom", weight: 1.0 },
    { name: "Battery Life", description: "Endurance, charging speed, wireless charging", weight: 1.0 },
    { name: "Display", description: "Screen quality, refresh rate, HDR support", weight: 0.9 },
    { name: "Software Experience", description: "OS, update policy, bloatware, privacy", weight: 0.9 },
    { name: "Ecosystem", description: "Accessories, app quality, cross-device features", weight: 0.8 },
  ],
  car: [
    { name: "Range & Efficiency", description: "EPA range, real-world efficiency, energy per mile", weight: 1.2 },
    { name: "Charging Network", description: "Supercharger access, charging speed, coverage", weight: 1.1 },
    { name: "Performance", description: "0-60 speed, handling, driving dynamics", weight: 0.9 },
    { name: "Interior Quality", description: "Materials, build quality, comfort, noise isolation", weight: 0.9 },
    { name: "Technology", description: "Infotainment, driver assistance, OTA updates, UI", weight: 0.9 },
    { name: "Value", description: "Price-to-features ratio, depreciation, tax credits", weight: 0.8 },
  ],
  city: [
    { name: "Cost of Living", description: "Rent, groceries, dining, transportation costs", weight: 1.2 },
    { name: "Job Market", description: "Tech salaries, startup scene, career opportunities", weight: 1.1 },
    { name: "Quality of Life", description: "Safety, healthcare, air quality, green spaces", weight: 1.0 },
    { name: "Transit & Mobility", description: "Public transport, walkability, bike infrastructure", weight: 0.9 },
    { name: "Culture & Community", description: "Events, diversity, arts, nightlife, food scene", weight: 0.9 },
    { name: "Tech Scene", description: "Startup density, VC presence, coworking spaces, meetups", weight: 0.8 },
  ],
  language: [
    { name: "Performance", description: "Execution speed, memory usage, compilation time", weight: 1.2 },
    { name: "Developer Experience", description: "Tooling, IDE support, error messages, debugging", weight: 1.0 },
    { name: "Ecosystem", description: "Libraries, packages, frameworks, community size", weight: 1.1 },
    { name: "Type Safety", description: "Type system strength, null safety, pattern matching", weight: 0.9 },
    { name: "Adoption", description: "Industry usage, job market, learning resources", weight: 0.8 },
    { name: "Learning Curve", description: "Syntax complexity, conceptual overhead, onboarding time", weight: 0.9 },
  ],
  framework: [
    { name: "Performance", description: "Rendering speed, virtual DOM, compile-time optimizations", weight: 1.2 },
    { name: "Developer Experience", description: "Tooling, TypeScript, hot reload, debugging", weight: 1.0 },
    { name: "Ecosystem", description: "Components, plugins, templates, community", weight: 1.0 },
    { name: "SSR / SSG", description: "Server rendering, static generation, edge deployment", weight: 0.9 },
    { name: "Bundle Size", description: "Initial payload, code splitting, tree shaking", weight: 0.8 },
    { name: "Learning Curve", description: "Time to productivity, documentation quality", weight: 0.9 },
  ],
  tool: [
    { name: "Features", description: "Capabilities, integrations, API surface", weight: 1.2 },
    { name: "Pricing", description: "Cost, free tier, value for money", weight: 1.1 },
    { name: "Developer Experience", description: "Setup, UI, documentation, API quality", weight: 1.0 },
    { name: "Performance", description: "Speed, resource usage, reliability", weight: 0.9 },
    { name: "Ecosystem", description: "Integrations, plugins, community, support", weight: 0.9 },
    { name: "Security", description: "Compliance, data handling, access controls", weight: 0.8 },
  ],
  security: [
    { name: "Encryption", description: "At rest, in transit, zero-knowledge options", weight: 1.2 },
    { name: "Privacy", description: "Data collection, jurisdiction, logging policies", weight: 1.0 },
    { name: "Usability", description: "Setup ease, cross-platform, UX quality", weight: 0.9 },
    { name: "Performance", description: "Speed, resource footprint, battery impact", weight: 0.8 },
    { name: "Features", description: "Password management, 2FA, sharing, aliases", weight: 0.9 },
    { name: "Ecosystem", description: "Integrations, browser extensions, mobile apps", weight: 0.8 },
  ],
  os: [
    { name: "Stability", description: "Crash frequency, update reliability, driver support", weight: 1.1 },
    { name: "Performance", description: "Boot time, resource usage, gaming FPS", weight: 1.0 },
    { name: "Software Availability", description: "App ecosystem, compatibility, package managers", weight: 1.1 },
    { name: "Customization", description: "Desktop environments, theming, scripting", weight: 0.9 },
    { name: "Security", description: "Vulnerability response, permissions model, sandboxing", weight: 0.9 },
    { name: "Learning Curve", description: "CLI familiarity, documentation, community help", weight: 0.8 },
  ],
  general: [
    { name: "Overall Value", description: "Cost-benefit ratio for the intended use case", weight: 1.2 },
    { name: "Reliability", description: "Uptime, bug frequency, quality assurance", weight: 1.0 },
    { name: "Ease of Use", description: "Setup complexity, learning curve, documentation", weight: 1.0 },
    { name: "Community", description: "Community size, support forums, third-party resources", weight: 0.9 },
    { name: "Performance", description: "Speed, efficiency, resource consumption", weight: 0.9 },
    { name: "Future Outlook", description: "Development velocity, roadmap, adoption trends", weight: 0.8 },
  ],
  vague: [
    { name: "Overall Value", description: "Cost-benefit ratio for the intended use case", weight: 1.2 },
    { name: "Reliability", description: "Uptime, bug frequency, quality assurance", weight: 1.0 },
    { name: "Ease of Use", description: "Setup complexity, learning curve, documentation", weight: 1.0 },
    { name: "Community", description: "Community size, support forums, third-party resources", weight: 0.9 },
    { name: "Performance", description: "Speed, efficiency, resource consumption", weight: 0.9 },
    { name: "Future Outlook", description: "Development velocity, roadmap, adoption trends", weight: 0.8 },
  ],
};

export function getDimensionTemplate(category: QueryCategory): DimensionTemplate[] {
  return getComparisonCategoryDefinition(category).defaultDimensions;
}

/**
 * Build a dimension generation prompt that includes category-specific guidance
 */
export function buildDimensionPrompt(
  entities: string[],
  context: string,
  category: QueryCategory,
): string {
  const definition = getComparisonCategoryDefinition(category);
  const template = getDimensionTemplate(category);
  const suggestedDims = template
    .slice(0, 5)
    .map((d) => `  - ${d.name}: ${d.description}`)
    .join("\n");
  const sourceRequirements = definition.sourceRequirements
    .map((item) => `  - ${item}`)
    .join("\n");

  return [
    `You are a comparison analyst specializing in the "${definition.label}" category.`,
    `Generate 4-6 comparison dimensions for: ${entities.join(" vs ")}`,
    context ? `Context: ${context}` : "",
    ``,
    `Suggested dimensions for this category:`,
    suggestedDims,
    ``,
    `Source expectations for this category:`,
    sourceRequirements || "  - primary and reputable secondary sources",
    ``,
    `Tone: ${definition.resultTone}`,
    definition.disclaimer ? `Required caveat: ${definition.disclaimer}` : "",
    ``,
    `Choose the most relevant dimensions. Add 1 category-specific dimension only if the source evidence supports it.`,
    `Return valid JSON array with { name, description, weight } only.`,
  ].filter(Boolean).join("\n");
}

// ─── Confidence Calibration ──────────────────────────────────────────────────

export function calibrateConfidence(params: {
  sourceCount: number;
  sourceReliabilityScores: number[];
  factsCount: number;
  dimensionsCovered: number;
  totalDimensions: number;
  freshnessClass: FreshnessClass;
}): number {
  // Multi-factor weighted confidence score (0–1)
  let confidence = 0;

  // Factor 1: Source count (max contribution: 0.25)
  const sourceCountFactor = Math.min(params.sourceCount / 12, 1) * 0.25;

  // Factor 2: Source reliability average (max contribution: 0.30)
  const avgReliability = params.sourceReliabilityScores.length > 0
    ? params.sourceReliabilityScores.reduce((a, b) => a + b, 0) / params.sourceReliabilityScores.length
    : 0.5;
  const reliabilityFactor = avgReliability * 0.30;

  // Factor 3: Facts per dimension (max contribution: 0.20)
  const factsPerDim = params.totalDimensions > 0
    ? params.factsCount / params.totalDimensions
    : 0;
  const factsFactor = Math.min(factsPerDim / 3, 1) * 0.20;

  // Factor 4: Dimension coverage (max contribution: 0.15)
  const coverage = params.totalDimensions > 0
    ? params.dimensionsCovered / params.totalDimensions
    : 0;
  const coverageFactor = coverage * 0.15;

  // Factor 5: Freshness bonus/penalty (max contribution: ±0.10)
  const freshnessBonus = params.freshnessClass === "volatile" ? -0.05
    : params.freshnessClass === "stable" ? 0.10
    : 0.05;
  const freshnessFactor = Math.max(0.5, 0.5 + freshnessBonus) * 0.10;

  confidence = sourceCountFactor + reliabilityFactor + factsFactor + coverageFactor + freshnessFactor;

  return Math.round(Math.min(Math.max(confidence, 0), 1) * 1000) / 1000;
}

// ─── Entity Knowledge Base — Fact Reuse ──────────────────────────────────────

export type EntityFact = {
  entity: string;
  dimension: string;
  value: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  createdAt: string;
};

/**
 * Determines if a fact is generic enough to be reused across comparisons.
 * Entity-specific facts (company names, specific prices) are NOT reusable.
 * Structural facts (architecture, approach, philosophy) ARE reusable.
 */
export function isReusableFact(fact: { value: string; dimension: string }): boolean {
  // Don't reuse pricing facts — they change too often
  if (fact.dimension.toLowerCase().includes("pricing")) return false;
  if (fact.dimension.toLowerCase().includes("cost")) return false;

  // Don't reuse version-specific or date-specific facts
  if (/\d+\.\d+\.\d+/.test(fact.value)) return false;
  if (/20\d\d/.test(fact.value)) return false;

  return true;
}

/**
 * Normalize an entity name for cross-comparison matching
 */
export function normalizeEntityForReuse(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)/g, "");
}
