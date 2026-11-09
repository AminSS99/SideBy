/**
 * Public comparison projection contract (v2).
 *
 * The public by-slug endpoint serves EXACTLY this shape — an explicit,
 * recursive server-side allowlist, not the stored research record. The
 * ShareModal preview renders this same projection client-side, so "what
 * you see is what publishes" is enforced by construction rather than copy.
 *
 * v2 corrections over v1:
 * - Facts keep their `a`/`b` entity attribution (v1 dropped it, silently
 *   losing "which entity does this fact describe").
 * - `verdict` and `taxonomy` are explicit versioned schemas, not keyed
 *   copies of arbitrary nested objects. Unknown nested fields never cross
 *   the boundary. Values are validated (labels required, finite numbers,
 *   safe http(s) URLs, parseable dates where present).
 * - The projection describes *public shape*, not *pubish eligibility*.
 *   Whether a record may be published at all is a separate server-side
 *   decision (see publishEligibility in the API layer) because the stored
 *   query/claims can themselves embed private context: removing fields
 *   can never sanitize content that was already generated from them.
 *
 * Kept deliberately even though they are derived: entity presentation color
 * and refresh change markers, because the public page reuses the same panels
 * and stripping them would silently change public rendering.
 */

const VERSION = "public-projection/v2";

export type PublicEntity = {
  name: string;
  subtitle: string;
  mark: string;
  /** Presentation color used by the shared score/chart components. */
  hex: string;
  logoUrl?: string;
};

export type PublicFact = {
  /** Which entity this fact is about. Required; attribution is the record. */
  entity: "a" | "b";
  label: string;
  value: string;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  freshness: "Fresh" | "Monitor" | "Stable";
  /** Refresh change markers the shared panels render; part of the record. */
  changed?: boolean;
  previousValue?: string;
};

export type PublicCategory = {
  name: string;
  winner: "a" | "b" | "tie";
  verdict: string;
  facts: PublicFact[];
};

export type PublicSource = {
  title: string;
  url: string;
  reliability: string;
  sourceType?: string;
  fetchedAt: string;
  confidence?: number;
  summary?: string;
};

/** Versioned public verdict schema: display strings only. */
export type PublicVerdict = {
  bestOverall?: string;
  bestValue?: string;
  developers?: string;
  teams?: string;
  students?: string;
  powerUsers?: string;
  ecosystem?: string;
  summary: string;
};

/** Versioned public taxonomy schema: display + policy-note fields only. */
export type PublicTaxonomy = {
  category: string;
  label: string;
  status: string;
  safetyLevel: string;
  confidence: number;
  disclaimer?: string;
  policyNote?: string;
  sourceRequirements: string[];
  freshnessClass?: string;
};

export type PublicComparisonResult = {
  query: string;
  entities: { a: PublicEntity; b: PublicEntity };
  dimensions: Array<{ subject: string; a: number; b: number; fullMark: number }>;
  consensus: string[];
  contradictions: string[];
  categories: PublicCategory[];
  sources: PublicSource[];
  verdict: PublicVerdict;
  provenance?: string;
  sourceCount: number;
  updatedAt: string;
  slug: string;
  taxonomy?: PublicTaxonomy;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pickString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const pickAnyString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === "string" ? value : null;
};

const pickNumber = (record: Record<string, unknown>, key: string): number | null => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const pickStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];

const pickWinner = (value: unknown): "a" | "b" | "tie" | null =>
  value === "a" || value === "b" || value === "tie" ? value : null;

const pickFreshness = (value: unknown): PublicFact["freshness"] =>
  value === "Fresh" || value === "Monitor" || value === "Stable" ? value : "Monitor";

/**
 * Safe URL schemes for public links: only absolute http(s) URLs pass;
 * anything else (javascript:, data:, relative) is dropped so stored
 * payloads can never smuggle script or private navigation into the public
 * page. Returns null for unusable values.
 */
export function pickSafePublicUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** Accept only parseable ISO-ish dates; otherwise fall back to empty. */
const pickDate = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return Number.isFinite(Date.parse(value)) ? value : "";
};

function projectEntity(value: unknown): PublicEntity | null {
  if (!isRecord(value)) return null;
  const name = pickString(value, "name");
  if (!name) return null;
  const entity: PublicEntity = {
    name,
    subtitle: pickString(value, "subtitle") ?? "",
    mark: pickString(value, "mark") ?? "",
    // The shared panels style scores by entity color; stripping it would
    // silently alter the public page, so presentation color stays public.
    hex: pickString(value, "hex") ?? "#f97316",
  };
  const logoUrl = pickSafePublicUrl(value.logoUrl);
  if (logoUrl) entity.logoUrl = logoUrl;
  return entity;
}

function projectFact(value: unknown): PublicFact | null {
  if (!isRecord(value)) return null;
  const entity = pickString(value, "entity");
  const label = pickString(value, "label");
  const factValue = pickString(value, "value");
  const confidence = pickNumber(value, "confidence");
  if ((entity !== "a" && entity !== "b") || !label || !factValue || confidence === null) {
    return null;
  }
  const fact: PublicFact = {
    entity,
    label,
    value: factValue,
    source: pickString(value, "source") ?? "",
    sourceUrl: pickSafePublicUrl(value.sourceUrl) ?? "",
    sourceTitle: pickString(value, "sourceTitle") ?? "",
    confidence,
    freshness: pickFreshness(value.freshness),
  };
  // Refresh change markers are rendered by the shared panels and belong to
  // the published record; stripping them would silently change public content.
  if (value.changed === true) fact.changed = true;
  const previousValue = pickAnyString(value, "previousValue");
  if (previousValue) fact.previousValue = previousValue;
  return fact;
}

function projectCategory(value: unknown): PublicCategory | null {
  if (!isRecord(value)) return null;
  const name = pickString(value, "name");
  const winner = pickWinner(value.winner);
  if (!name || !winner) return null;
  const facts = Array.isArray(value.facts)
    ? value.facts.map(projectFact).filter((fact): fact is PublicFact => fact !== null)
    : [];
  return { name, winner, verdict: pickString(value, "verdict") ?? "", facts };
}

function projectSource(value: unknown): PublicSource | null {
  if (!isRecord(value)) return null;
  const url = pickSafePublicUrl(value.url);
  if (!url) return null;
  const source: PublicSource = {
    title: pickString(value, "title") ?? "",
    url,
    reliability: pickString(value, "reliability") ?? "Community",
    fetchedAt: pickDate(value.fetchedAt),
  };
  const sourceType = pickString(value, "sourceType");
  if (sourceType) source.sourceType = sourceType;
  const confidence = pickNumber(value, "confidence");
  if (confidence !== null) source.confidence = confidence;
  const summary = pickString(value, "summary");
  if (summary) source.summary = summary;
  return source;
}

const VERDICT_KEYS = [
  "bestOverall",
  "bestValue",
  "developers",
  "teams",
  "students",
  "powerUsers",
  "ecosystem",
] as const;

function projectVerdict(value: unknown): PublicVerdict {
  if (!isRecord(value)) return { summary: "" };
  const verdict: PublicVerdict = { summary: pickString(value, "summary") ?? "" };
  for (const key of VERDICT_KEYS) {
    const text = pickString(value, key);
    if (text) verdict[key] = text;
  }
  return verdict;
}

function projectTaxonomy(value: unknown): PublicTaxonomy | null {
  if (!isRecord(value)) return null;
  const category = pickString(value, "category");
  const label = pickString(value, "label");
  if (!category || !label) return null;
  const taxonomy: PublicTaxonomy = {
    category,
    label,
    status: pickString(value, "status") ?? "unknown",
    safetyLevel: pickString(value, "safetyLevel") ?? "standard",
    confidence: pickNumber(value, "confidence") ?? 0,
    sourceRequirements: pickStringArray(value.sourceRequirements),
  };
  const disclaimer = pickString(value, "disclaimer");
  if (disclaimer) taxonomy.disclaimer = disclaimer;
  const policyNote = pickString(value, "policyNote");
  if (policyNote) taxonomy.policyNote = policyNote;
  const freshnessClass = pickString(value, "freshnessClass");
  if (freshnessClass) taxonomy.freshnessClass = freshnessClass;
  return taxonomy;
}

function projectEntities(value: unknown): PublicComparisonResult["entities"] | null {
  if (!isRecord(value)) return null;
  const a = projectEntity(value.a);
  const b = projectEntity(value.b);
  if (!a || !b) return null;
  return { a, b };
}

/**
 * Project a stored comparison result to the public contract.
 * Returns null when the payload cannot be represented safely.
 */
export function projectPublicResult(input: unknown): PublicComparisonResult | null {
  if (!isRecord(input)) return null;
  const query = pickString(input, "query");
  const entities = projectEntities(input.entities);
  if (!query || !entities) return null;

  const dimensions = Array.isArray(input.dimensions)
    ? input.dimensions.flatMap((item) => {
        if (!isRecord(item)) return [];
        const subject = pickString(item, "subject");
        const a = pickNumber(item, "a");
        const b = pickNumber(item, "b");
        const fullMark = pickNumber(item, "fullMark");
        if (!subject || a === null || b === null || fullMark === null) return [];
        return [{ subject, a, b, fullMark }];
      })
    : [];

  const categories = Array.isArray(input.categories)
    ? input.categories.map(projectCategory).filter((c): c is PublicCategory => c !== null)
    : [];

  const sources = Array.isArray(input.sources)
    ? input.sources.map(projectSource).filter((s): s is PublicSource => s !== null)
    : [];

  const result: PublicComparisonResult = {
    query,
    entities,
    dimensions,
    consensus: pickStringArray(input.consensus),
    contradictions: pickStringArray(input.contradictions),
    categories,
    sources,
    verdict: projectVerdict(input.verdict),
    sourceCount: pickNumber(input, "sourceCount") ?? sources.length,
    updatedAt: pickDate(input.updatedAt),
    slug: pickString(input, "slug") ?? "",
  };

  const provenance = pickString(input, "provenance");
  if (provenance) result.provenance = provenance;
  const taxonomy = projectTaxonomy(input.taxonomy);
  if (taxonomy) result.taxonomy = taxonomy;

  return result;
}

export const PUBLIC_PROJECTION_VERSION = VERSION;
