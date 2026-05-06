export type QueryIntentStatus = "ready" | "needs_entities" | "needs_context" | "incomparable";

export type QueryIntent = {
  status: QueryIntentStatus;
  canStart: boolean;
  confidence: number;
  entityA: string | null;
  entityB: string | null;
  category: string | null;
  message: string;
  suggestion?: string;
};

const knownCategories: Record<string, string[]> = {
  frontend: ["react", "vue", "angular", "svelte", "next.js", "nuxt", "gatsby", "remix", "astro", "tailwind", "bootstrap"],
  backend: ["supabase", "firebase", "node", "django", "rails", "laravel", "spring", "express", "fastapi", "flask", "nestjs"],
  database: ["neon", "postgres", "postgresql", "mysql", "mongodb", "planetscale", "cockroachdb", "dynamodb", "redis", "sqlite", "drizzle", "prisma"],
  hosting: ["vercel", "netlify", "render", "railway", "fly.io", "heroku", "aws", "azure", "gcp", "cloudflare", "digitalocean"],
  ai: ["chatgpt", "claude", "gemini", "openai", "anthropic", "perplexity", "mistral", "llama", "cursor", "windsurf", "copilot"],
  laptop: ["macbook", "thinkpad", "xps", "surface", "zenbook", "spectre", "legion"],
  car: ["tesla", "bmw", "mercedes", "audi", "toyota", "honda", "ford", "porsche", "hyundai", "kia", "rivian"],
  city: ["berlin", "munich", "london", "paris", "tokyo", "singapore", "amsterdam", "new york", "zurich", "dubai"],
};

const vaguePatterns = [
  /^what(\s+is)?\s+the\s+best/i,
  /^which(\s+one)?\s+(is\s+)?(the\s+)?best/i,
  /^recommend/i,
  /^help\s+me\s+(choose|decide|pick|find)/i,
  /^(should|can)\s+i\s+(use|get|buy)/i,
  /^best\s+\w+\s+for/i,
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[^a-z0-9\s+./-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cleanEntity = (value: string) =>
  value
    .replace(/\b(for|with|inside|on|because|when)\b.*$/i, "")
    .replace(/[^a-z0-9\s+./-]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const detectCategory = (entity: string) => {
  const normalized = normalize(entity);
  for (const [category, products] of Object.entries(knownCategories)) {
    if (products.some((product) => normalized.includes(product) || product.includes(normalized))) {
      return category;
    }
  }
  return null;
};

const detectQueryCategory = (query: string) => {
  const normalized = normalize(query);
  for (const category of Object.keys(knownCategories)) {
    if (normalized.includes(category)) return category;
  }
  return null;
};

const extractEntities = (query: string) => {
  const parts = query.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return { entityA: "", entityB: "" };

  const entityA = cleanEntity(parts[0]);
  const [right] = parts.slice(1).join(" vs ").split(/\s+for\s+/i);
  const entityB = cleanEntity(right);
  return { entityA, entityB };
};

export const analyzeQueryIntent = (rawQuery: string): QueryIntent => {
  const query = rawQuery.trim();

  if (!query) {
    return {
      status: "needs_entities",
      canStart: false,
      confidence: 0,
      entityA: null,
      entityB: null,
      category: null,
      message: "Type two things to compare.",
      suggestion: "Supabase vs Firebase for a SaaS",
    };
  }

  if (query.length < 7) {
    return {
      status: "needs_entities",
      canStart: false,
      confidence: 0.2,
      entityA: null,
      entityB: null,
      category: null,
      message: "This is too short to compare confidently.",
      suggestion: `${query} vs another option`,
    };
  }

  if (vaguePatterns.some((pattern) => pattern.test(query))) {
    const category = detectQueryCategory(query);
    return {
      status: "needs_entities",
      canStart: false,
      confidence: 0.45,
      entityA: null,
      entityB: null,
      category,
      message: "This sounds like a recommendation request. Pick two concrete options first.",
      suggestion: category === "hosting" ? "Vercel vs Render for a SaaS" : "Option A vs Option B for your use case",
    };
  }

  const { entityA, entityB } = extractEntities(query);
  if (!entityA || !entityB) {
    return {
      status: "needs_entities",
      canStart: false,
      confidence: 0.35,
      entityA: entityA || null,
      entityB: entityB || null,
      category: detectQueryCategory(query),
      message: "Use a clear A vs B shape so research can target the right sources.",
      suggestion: "Supabase vs Firebase for a SaaS",
    };
  }

  if (normalize(entityA) === normalize(entityB)) {
    return {
      status: "incomparable",
      canStart: false,
      confidence: 0.95,
      entityA: titleCase(entityA),
      entityB: titleCase(entityB),
      category: detectCategory(entityA),
      message: "Both sides look identical. Choose two different options.",
    };
  }

  const categoryA = detectCategory(entityA);
  const categoryB = detectCategory(entityB);
  const category = categoryA && categoryA === categoryB ? categoryA : categoryA || categoryB || detectQueryCategory(query);

  if (categoryA && categoryB && categoryA !== categoryB) {
    return {
      status: "incomparable",
      canStart: false,
      confidence: 0.86,
      entityA: titleCase(entityA),
      entityB: titleCase(entityB),
      category: null,
      message: `${titleCase(entityA)} and ${titleCase(entityB)} look like different kinds of things. Add a shared decision context if you really mean this.`,
      suggestion: `${titleCase(entityA)} vs another ${categoryA} option`,
    };
  }

  const hasContext = /\s+for\s+[\w\s-]{3,}$/i.test(query);
  const confidence = category ? (hasContext ? 0.94 : 0.82) : (hasContext ? 0.72 : 0.62);

  return {
    status: hasContext || category ? "ready" : "needs_context",
    canStart: true,
    confidence,
    entityA: titleCase(entityA),
    entityB: titleCase(entityB),
    category,
    message: hasContext
      ? `Ready to compare ${titleCase(entityA)} and ${titleCase(entityB)} in this context.`
      : `Comparable. Add "for ..." if you want a sharper verdict.`,
    suggestion: hasContext ? undefined : `${titleCase(entityA)} vs ${titleCase(entityB)} for a SaaS`,
  };
};
