/**
 * Query Normalizer — canonicalization, entity detection, duplicate grouping.
 * Phase 10: Usage Learning + Query Quality Optimization.
 */

export type QueryCategory =
  | "frontend"
  | "backend"
  | "database"
  | "hosting"
  | "ai_llm"
  | "laptop"
  | "phone"
  | "car"
  | "city"
  | "language"
  | "framework"
  | "tool"
  | "security"
  | "os"
  | "vague"
  | "general";

export type NormalizedQuery = {
  rawQuery: string;
  normalizedQuery: string;
  canonicalSlug: string;
  entityA: string;
  entityB: string;
  category: QueryCategory;
  isVague: boolean;
  suggestedQuery?: string;
};

// ─── Known Entity Map ────────────────────────────────────────────────────────

const knownProducts: Record<string, string[]> = {
  frontend: ["react", "vue", "angular", "svelte", "next.js", "nuxt", "gatsby", "remix", "astro", "tailwindcss", "bootstrap", "solidjs", "qwik", "elm"],
  backend: ["supabase", "firebase", "node.js", "django", "rails", "laravel", "spring", "express", "fastapi", "flask", "nestjs", "graphql", "rest"],
  database: ["neon", "supabase", "firebase", "mongodb", "postgresql", "mysql", "planetscale", "cockroachdb", "dynamodb", "prisma", "drizzle", "redis", "sqlite", "cassandra"],
  hosting: ["vercel", "netlify", "render", "railway", "fly.io", "heroku", "aws", "azure", "gcp", "digitalocean", "cloudflare"],
  ai_llm: ["chatgpt", "claude", "gemini", "openai", "anthropic", "perplexity", "mistral", "llama", "cursor", "windsurf", "copilot", "cohere"],
  laptop: ["macbook", "thinkpad", "xps", "surface", "zenbook", "spectre", "legion", "rog"],
  car: ["tesla", "bmw", "mercedes", "audi", "toyota", "honda", "ford", "porsche", "hyundai", "kia", "volkswagen", "rivian", "lucid"],
  city: ["berlin", "munich", "london", "paris", "tokyo", "singapore", "amsterdam", "san francisco", "new york", "zurich", "barcelona", "stockholm", "lisbon", "dubai", "toronto"],
  language: ["typescript", "javascript", "python", "rust", "go", "kotlin", "swift", "dart", "elixir", "ruby", "php", "java", "c++", "zig"],
  framework: ["react", "vue", "angular", "svelte", "next.js", "nuxt", "django", "rails", "laravel", "spring", "fastapi"],
};

const categoryKeywords: Record<string, QueryCategory> = {
  "frontend": "frontend",
  "ui framework": "frontend",
  "web framework": "frontend",
  "dashboard": "frontend",
  "spa": "frontend",
  "component library": "frontend",
  "css framework": "frontend",
  "backend": "backend",
  "baas": "backend",
  "api": "backend",
  "server": "backend",
  "microservices": "backend",
  "database": "database",
  "db": "database",
  "postgres": "database",
  "mysql": "database",
  "nosql": "database",
  "sql": "database",
  "orm": "database",
  "hosting": "hosting",
  "deploy": "hosting",
  "cloud": "hosting",
  "paas": "hosting",
  "serverless": "hosting",
  "cdn": "hosting",
  "ai": "ai_llm",
  "llm": "ai_llm",
  "chatbot": "ai_llm",
  "ml": "ai_llm",
  "machine learning": "ai_llm",
  "coding assistant": "ai_llm",
  "laptop": "laptop",
  "notebook": "laptop",
  "ultrabook": "laptop",
  "computer": "laptop",
  "car": "car",
  "ev": "car",
  "electric vehicle": "car",
  "sedan": "car",
  "suv": "car",
  "city": "city",
  "town": "city",
  "country": "city",
  "mobile": "phone",
  "phone": "phone",
  "smartphone": "phone",
};

// ─── Canonicalization ────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Sort two entity names alphabetically for canonical slug
 * (React vs Vue → same slug as Vue vs React)
 */
function canonicalEntityOrder(a: string, b: string): [string, string] {
  const an = normalize(a);
  const bn = normalize(b);
  return an <= bn ? [a, b] : [b, a];
}

// ─── Detect Category from Query ──────────────────────────────────────────────

function detectCategory(query: string): QueryCategory {
  const q = normalize(query);

  // Check explicit category keywords
  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (q.includes(keyword)) return category;
  }

  // If query is just "X vs Y", try to detect from known products
  const parts = q.split(/\s+vs\.?\s+/);
  if (parts.length >= 2) {
    const entityA = parts[0].trim();
    const entityB = parts[1].trim();

    for (const [cat, products] of Object.entries(knownProducts)) {
      const aMatches = products.some((p) => entityA.includes(p) || p.includes(entityA));
      const bMatches = products.some((p) => entityB.includes(p) || p.includes(entityB));
      if (aMatches && bMatches) return cat as QueryCategory;
    }
  }

  return "general";
}

// ─── Detect Vague Queries ────────────────────────────────────────────────────

const vaguePatterns = [
  /^what(\s+is)?\s+the\s+best/i,
  /^which(\s+one)?\s+(is\s+)?(the\s+)?best/i,
  /^recommend\s+(a\s+)?(me\s+)?/i,
  /^what(\s+is)?\s+better/i,
  /^best\s+\w+\s+for/i,
  /^what\s+\w+\s+to\s+(choose|use|pick|buy)/i,
  /^help\s+me\s+(choose|decide|pick|find)/i,
  /^(should|can)\s+i\s+(use|get|buy)/i,
  /^which\s+(laptop|computer|car|phone|city|language|framework|tool|database|hosting|backend)/i,
];

function isVagueQuery(query: string): boolean {
  return vaguePatterns.some((p) => p.test(query.trim()));
}

// ─── Suggest entities for vague queries ──────────────────────────────────────

function suggestEntities(query: string): string | undefined {
  const q = normalize(query);
  const categories: QueryCategory[] = [];

  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (q.includes(keyword)) categories.push(category);
  }

  // Try to detect a single category for entity suggestions
  const primaryCat = categories[0];
  if (!primaryCat || primaryCat === "general") return undefined;

  const products = knownProducts[primaryCat];
  if (!products || products.length < 2) return undefined;

  // If one entity is already mentioned, suggest the other
  const mentioned = products.find((p) => q.includes(p));
  if (mentioned) {
    const others = products.filter((p) => p !== mentioned && p.length > 2);
    if (others.length >= 2) {
      return `${mentioned.charAt(0).toUpperCase() + mentioned.slice(1)} vs ${others[0].charAt(0).toUpperCase() + others[0].slice(1)}`;
    }
    if (others[0]) {
      return `${mentioned.charAt(0).toUpperCase() + mentioned.slice(1)} vs ${others[0].charAt(0).toUpperCase() + others[0].slice(1)}`;
    }
  }

  // Suggest top 2 products in the category
  return `${products[0].charAt(0).toUpperCase() + products[0].slice(1)} vs ${products[1].charAt(0).toUpperCase() + products[1].slice(1)}`;
}

// ─── Main Normalizer ─────────────────────────────────────────────────────────

export function normalizeQuery(rawQuery: string): NormalizedQuery {
  const normalized = normalize(rawQuery);
  const isVague = isVagueQuery(rawQuery);
  const category = detectCategory(normalized);

  let entityA = "";
  let entityB = "";

  const parts = normalized.split(/\s+vs\.?\s+/);
  if (parts.length >= 2) {
    entityA = parts[0].trim();
    // Strip trailing "for X" context
    entityB = parts[1].split(/\s+for\s+/)[0].trim();
  } else {
    // For non-vs queries, try to detect known entities
    for (const products of Object.values(knownProducts)) {
      const found = products.filter((p) => normalized.includes(p));
      if (found.length >= 2) {
        entityA = found[0];
        entityB = found[1];
        break;
      }
    }
  }

  if (!entityA || !entityB) {
    entityA = "unknown";
    entityB = "unknown";
  }

  const [canonA, canonB] = canonicalEntityOrder(entityA, entityB);
  const canonicalSlug = slugify(`${canonA}-vs-${canonB}`);

  const result: NormalizedQuery = {
    rawQuery,
    normalizedQuery: normalized,
    canonicalSlug,
    entityA: canonA,
    entityB: canonB,
    category,
    isVague,
  };

  if (isVague) {
    const suggestion = suggestEntities(normalized);
    if (suggestion) result.suggestedQuery = suggestion;
  }

  return result;
}

/**
 * Generate detection metadata for AI-parsed entities (from step 1)
 */
export function buildDetectedEntitiesMeta(entities: Array<{ name: string; type?: string }>): string {
  return JSON.stringify(entities.map((e) => ({
    name: e.name.toLowerCase(),
    type: e.type || null,
  })));
}

/**
 * Check if a canonical slug has existing public comparisons
 * Returns the existing comparison ID if found
 */
export async function findExistingByCanonicalSlug(
  db: ReturnType<typeof import("../../src/db/index.js").createDbClient>,
  canonicalSlug: string,
): Promise<string | null> {
  const { comparisons } = await import("../../src/db/schema.js");
  const { eq, or } = await import("drizzle-orm");

  // Check for any public comparison with matching canonical slug
  const rows = await db
    .select({ id: comparisons.id })
    .from(comparisons)
    .where(
      or(
        eq(comparisons.slug, canonicalSlug),
        // Also check for timestamped slugs that share the same base
      ),
    )
    .limit(1);

  // Broad match: check if any existing comparison slug starts with the canonical slug
  if (rows.length === 0) {
    const { like } = await import("drizzle-orm");
    const fuzzyRows = await db
      .select({ id: comparisons.id })
      .from(comparisons)
      .where(like(comparisons.slug, `${canonicalSlug}%`))
      .limit(1);
    return fuzzyRows[0]?.id || null;
  }

  return rows[0]?.id || null;
}
