import {
  GitCompareArrows,
  Search,
  BadgeCheck,
  BookOpenText,
  FileSearch,
  Boxes,
} from "lucide-react";
import { colors } from "@/config/brand";
import type { ComparisonData, ResearchStep } from "@/components/Comparison/types";

export const researchSteps: ResearchStep[] = [
  { label: "Understanding query", detail: "Parsing entities and decision context", icon: GitCompareArrows },
  { label: "Finding official sources", detail: "Prioritizing pricing, docs, and product pages", icon: Search },
  { label: "Checking pricing", detail: "Flagging values that need fast refresh windows", icon: BadgeCheck },
  { label: "Reading docs", detail: "Extracting capabilities and integration notes", icon: BookOpenText },
  { label: "Extracting facts", detail: "Adding source URLs, confidence, and timestamps", icon: FileSearch },
  { label: "Building comparison", detail: "Creating category winners and nuanced verdicts", icon: Boxes },
];

export const normalizeEntity = (name: string) =>
  name.replace(/\b(for|with|inside|on)\b.*$/i, "").replace(/[^a-z0-9\s+.-]/gi, "").trim();

export const parseQuery = (query: string) => {
  const [left, rightWithContext] = query.split(/\s+vs\.?\s+/i);
  const [right, contextTail] = (rightWithContext || "").split(/\s+for\s+/i);
  const entityA = normalizeEntity(left || "Supabase") || "Supabase";
  const entityB = normalizeEntity(right || "Firebase") || "Firebase";
  const context = contextTail?.trim()
    ? `for ${contextTail.trim()}`
    : query.toLowerCase().includes("saas")
      ? "for a SaaS product"
      : "for the decision you described";
  return { entityA, entityB, context };
};

export const makeSlug = (a: string, b: string) =>
  `${a}-vs-${b}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const titleCase = (v: string) =>
  v.split(" ").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

export const productSubtitle = (name: string) => {
  const l = name.toLowerCase();
  if (l.includes("supabase")) return "Open-source Postgres platform";
  if (l.includes("firebase")) return "Google-backed app platform";
  if (l.includes("cursor")) return "AI-native code editor";
  if (l.includes("windsurf")) return "Agentic developer environment";
  if (l.includes("paddle")) return "Merchant of record billing";
  if (l.includes("revenuecat")) return "Subscription infrastructure";
  if (l.includes("chatgpt")) return "OpenAI consumer AI plan";
  if (l.includes("claude")) return "Anthropic consumer AI plan";
  if (l.includes("vercel")) return "Frontend cloud platform";
  if (l.includes("render")) return "Cloud app hosting platform";
  return "Product research target";
};

export const buildResult = (query: string, refreshCount: number, previousResult?: ComparisonData | null): ComparisonData => {
  const { entityA, entityB, context } = parseQuery(query);
  const now = refreshCount > 0 ? "just now" : "2 min ago";
  const changed = refreshCount > 0;

  const entities = {
    a: { name: titleCase(entityA), subtitle: productSubtitle(entityA), mark: entityA.slice(0, 1).toUpperCase(), hex: colors.entityA },
    b: { name: titleCase(entityB), subtitle: productSubtitle(entityB), mark: entityB.slice(0, 1).toUpperCase(), hex: colors.entityB },
  };

  const result: ComparisonData = {
    slug: makeSlug(entityA, entityB),
    query,
    context,
    entities,
    sourceCount: changed ? 14 : 12,
    updatedAt: now,
    verdict: {
      bestOverall: entities.a.name,
      bestValue: entities.b.name,
      developers: entities.a.name,
      teams: entities.b.name,
      students: "Depends on usage cap",
      powerUsers: entities.a.name,
      ecosystem: entities.b.name,
      summary: `${entities.a.name} has the edge when control, extensibility, and developer velocity matter. ${entities.b.name} is still the safer recommendation for teams that want more managed defaults, broader ecosystem gravity, and less infrastructure ownership. Pricing-sensitive claims should be treated as fast-moving unless confirmed from official sources.`,
    },
    categories: [
      {
        name: "Pricing and plan clarity",
        winner: "tie",
        verdict: "Both need current official pricing checks before a purchase decision.",
        facts: [
          { entity: "a" as const, label: "Pricing posture", value: changed ? "Official pricing reviewed; usage-based lines changed since last run." : "Usage-based pricing with free tier signals; exact totals depend on workload.", source: "Official pricing page", sourceUrl: "#", sourceTitle: `${entities.a.name} pricing`, confidence: 0.86, freshness: "Monitor" as const, changed },
          { entity: "b" as const, label: "Pricing posture", value: "Generous starter path, but production costs vary by product mix.", source: "Official pricing page", sourceUrl: "#", sourceTitle: `${entities.b.name} pricing`, confidence: 0.84, freshness: "Monitor" as const },
        ],
      },
      {
        name: "Developer workflow",
        winner: "a",
        verdict: "The left option is stronger for teams that want inspectable primitives and SQL-native control.",
        facts: [
          { entity: "a" as const, label: "Core workflow", value: "Postgres-first architecture with SQL, auth, storage, and edge functions.", source: "Official docs", sourceUrl: "#", sourceTitle: `${entities.a.name} docs`, confidence: 0.91, freshness: "Fresh" as const },
          { entity: "b" as const, label: "Core workflow", value: "Integrated SDKs and managed services reduce setup for common app patterns.", source: "Official docs", sourceUrl: "#", sourceTitle: `${entities.b.name} docs`, confidence: 0.88, freshness: "Fresh" as const },
        ],
      },
      {
        name: "Ecosystem and integrations",
        winner: "b",
        verdict: "The right option benefits from broader default ecosystem pull and platform integrations.",
        facts: [
          { entity: "a" as const, label: "Integration profile", value: "Strong fit with modern web stacks and Postgres tooling.", source: "Docs and integration catalog", sourceUrl: "#", sourceTitle: `${entities.a.name} integrations`, confidence: 0.82, freshness: "Stable" as const },
          { entity: "b" as const, label: "Integration profile", value: "Deep platform ecosystem with analytics, messaging, hosting, and mobile SDKs.", source: "Official product docs", sourceUrl: "#", sourceTitle: `${entities.b.name} docs`, confidence: 0.89, freshness: "Stable" as const },
        ],
      },
      {
        name: "Risk and lock-in",
        winner: "a",
        verdict: "Open standards and portability reduce long-term lock-in risk for technical teams.",
        facts: [
          { entity: "a" as const, label: "Portability", value: "Postgres foundation gives clearer migration and self-hosting pathways.", source: "Official docs", sourceUrl: "#", sourceTitle: `${entities.a.name} docs`, confidence: 0.87, freshness: "Stable" as const },
          { entity: "b" as const, label: "Portability", value: "Managed convenience can create product-specific architecture dependencies.", source: "Docs and migration notes", sourceUrl: "#", sourceTitle: `${entities.b.name} docs`, confidence: 0.79, freshness: "Stable" as const },
        ],
      },
    ],
    sources: [
      { title: `${entities.a.name} official pricing`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.a.name} official pricing`)}`, reliability: "Official" as const, fetchedAt: "3 min ago" },
      { title: `${entities.b.name} official pricing`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.b.name} official pricing`)}`, reliability: "Official" as const, fetchedAt: "4 min ago" },
      { title: `${entities.a.name} product docs`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.a.name} docs`)}`, reliability: "Docs" as const, fetchedAt: "6 min ago" },
      { title: `${entities.b.name} product docs`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.b.name} docs`)}`, reliability: "Docs" as const, fetchedAt: "8 min ago" },
    ],
  };

  if (previousResult) {
    return detectClientChanges(result, previousResult);
  }

  return result;
};

export const detectClientChanges = (current: ComparisonData, previous: ComparisonData): ComparisonData => {
  const oldFacts = new Map<string, string>();
  for (const cat of previous.categories) {
    for (const f of cat.facts) {
      oldFacts.set(`${f.entity}:${f.label}`, f.value);
    }
  }

  const categories = current.categories.map((cat) => ({
    ...cat,
    facts: cat.facts.map((f) => {
      const key = `${f.entity}:${f.label}`;
      const oldValue = oldFacts.get(key);
      if (oldValue !== undefined && oldValue !== f.value) {
        return { ...f, changed: true, previousValue: oldValue };
      }
      return { ...f, changed: false };
    }),
  }));

  return { ...current, categories, sourceCount: current.sourceCount + 1, updatedAt: "just now" };
};