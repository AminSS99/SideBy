/**
 * Server-authoritative publish eligibility (v3 — publication authorization
 * model, LAUNCH-01).
 *
 * What this gate actually establishes, fact by fact:
 *
 * 1. INPUT AUTHORIZATION (new in v3). Many SideBy comparisons are written
 *    from a private brief: "React vs Vue for my sister's SaaS startup",
 *    priorities and non-negotiables, follow-up questions. Facts, summaries
 *    and verdicts are generated UNDER the influence of that brief, so the
 *    content itself can embed private context even when every field is
 *    stripped. No regex, keyword scan or "field cleanup" can prove a text
 *    was not influenced by private input, so eligibility is derived from a
 *    fact the server wrote at generation time instead: `input_scope`.
 *    Only records the server generated as dedicated public snapshots —
 *    whose entire input was the frozen entity pair, constructed server-side
 *    — may qualify. `input_scope = 'unknown'` (the rule for legacy rows,
 *    reuse-materialized rows and every unattributed path) fails closed.
 *    A record derived from private briefs/uploads/notes therefore requires
 *    a separate approved public snapshot generated from authorized public
 *    inputs, or remains unpublishable. This fixes the model rather than
 *    renaming a misleading classifier.
 *
 * 2. PIPELINE PROVENANCE. `ai_runs` rows prove the research pipeline — not
 *    a seeded/edited JSON blob — produced this record.
 *
 * 3. CLAIM ATTRIBUTION. `comparison_facts.source_url` rows: every retained
 *    claim must trace to an http(s) citation the pipeline saved. The
 *    pipeline writes "#" when it could not attach a crawl source; such
 *    claims are unattributable and can never publish, however plausible.
 *
 * 4. CLAIM ↔ SOURCE CORRESPONDENCE (new in v3). A fact's citation must
 *    correspond to the pipeline's own source inventory (`comparison_sources`),
 *    not merely to "some absolute URL that exists". Attribution stays a
 *    statement about evidence lineage; it is never proof a claim is true or
 *    that the URL still resolves.
 *
 * Classification (fail closed — anything unproven is denied):
 * - "verified-research": authorized public input + pipeline run completed +
 *   ≥1 cited fact, 0 uncited + full claim↔inventory correspondence.
 * - "not-pipeline": no completed pipeline run for this comparison.
 * - "unattributed": claims without retrievable pipeline citations.
 * - "uncorresponded": citations that no entry of the pipeline's source
 *   inventory matches.
 * - "incomplete": verdict or source inventory missing.
 * - "not-public-input": the record was not generated as an authorized
 *   public snapshot (pre-model rows, reuse/refresh derivatives, unknown
 *   provenance). No silent grandfathering.
 * - "unknown": record missing or malformed.
 *
 * The stored JSON `provenance` field is deliberately never consulted here.
 * Illustrative fixtures are classified separately by trusted hash match in
 * the by-slug route and are never eligible through this path.
 */

export type EvidenceClassification =
  | "verified-research"
  | "not-pipeline"
  | "unattributed"
  | "uncorresponded"
  | "not-public-input"
  | "incomplete"
  | "unknown";

/** The only input scope a publication may consume. */
export const AUTHORIZED_INPUT_SCOPE = "public";

export type PublishEligibility = {
  eligible: boolean;
  classification: EvidenceClassification;
  reasons: string[];
};

export type ServerEvidence = {
  /**
   * Server-written input-scope column from `comparisons.input_scope`.
   * 'public' = generated as a dedicated public snapshot from entity-pair-only
   * input. Anything else is out of scope for publication.
   */
  inputScope: string | null;
  /** A completed ai_runs row exists (pipeline-produced, server-written). */
  pipelineRunPresent: boolean;
  /** Normalized facts with an http(s) citation. */
  citedFactCount: number;
  /** Normalized facts with a missing/placeholder/non-web citation. */
  uncitedFactCount: number;
  /**
   * The pipeline's own source inventory (`comparison_sources.url` and
   * canonical URLs). Claim correspondence is checked against this list,
   * never against "some valid URL".
   */
  sourceInventory: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Only absolute http(s) URLs count as retrievable public citations. */
export const isRetrievableCitation = (value: unknown): boolean => {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.length > 0;
  } catch {
    return false;
  }
};

/**
 * Parse and normalize an absolute HTTP(S) URL for equality comparisons.
 * Normalizes protocol, lowercase host (preserving port), pathname (stripping
 * trailing slash), sorted search parameters, and drops hash fragments.
 * Returns null for invalid or non-http(s) URLs.
 */
export function normalizeCitationUrl(value: string): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.host) return null;

    const host = parsed.host.toLowerCase();
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    const searchParams = new URLSearchParams(parsed.search);
    searchParams.sort();
    const query = searchParams.toString();

    return `${parsed.protocol}//${host}${pathname}${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}

/**
 * Does a fact citation correspond to an entry of the pipeline's source
 * inventory? Compares parsed, normalized URL equality so unrelated domains
 * or disparate paths can never falsely match via substring containment.
 */
export const correspondsToInventory = (
  citation: string,
  inventory: readonly string[],
): boolean => {
  if (inventory.length === 0) return false;
  const normalizedCitation = normalizeCitationUrl(citation);
  if (!normalizedCitation) return false;

  return inventory.some((entry) => {
    const normalizedEntry = normalizeCitationUrl(entry);
    return normalizedEntry !== null && normalizedCitation === normalizedEntry;
  });
};

/**
 * Decide whether a stored comparison may be published and served as public
 * research. `evidence` must come from server-side tables and columns; never
 * from the request or arbitrary stored JSON.
 */
export function assessPublishPrivacy(
  result: unknown,
  evidence: ServerEvidence,
): PublishEligibility {
  if (!isRecord(result)) {
    return {
      eligible: false,
      classification: "unknown",
      reasons: ["This comparison record is missing."],
    };
  }

  const reasons: string[] = [];
  let classification: EvidenceClassification = "verified-research";

  // Input authorization is the first boundary: provenance and attribution
  // cannot compensate for content that was generated from a private brief.
  if (evidence.inputScope !== AUTHORIZED_INPUT_SCOPE) {
    classification = "not-public-input";
    if (evidence.inputScope === null) {
      reasons.push(
        "This record's generation inputs can't be verified by the server, so it can't be made public.",
      );
    } else {
      reasons.push(
        "This comparison was generated from a written brief or other private input, so its content can't be verified free of private context. Public sharing requires a separate public snapshot generated from just the two option names.",
      );
    }
  }

  if (!evidence.pipelineRunPresent) {
    if (classification === "verified-research") classification = "not-pipeline";
    reasons.push(
      "There's no server-side research run for this record, so its claims can't be verified as pipeline research.",
    );
  }

  if (evidence.citedFactCount === 0 || evidence.uncitedFactCount > 0) {
    if (classification === "verified-research") classification = "unattributed";
    if (evidence.citedFactCount === 0) {
      reasons.push("No claims carry a retrievable citation from the research pipeline.");
    }
    if (evidence.uncitedFactCount > 0) {
      reasons.push(
        `${evidence.uncitedFactCount} claim${evidence.uncitedFactCount === 1 ? " has" : "s have"} no retrievable citation. Publishing would present assertions as sourced evidence.`,
      );
    }
  }

  if (evidence.sourceInventory.length === 0) {
    if (classification === "verified-research") classification = "incomplete";
    reasons.push("The research pipeline didn't record a source inventory for this record.");
  }

  // Payload-level belt-and-braces: the JSON being published must agree with
  // the normalized evidence (guards against JSON/table divergence).
  const categories = Array.isArray(result.categories) ? result.categories : [];
  let payloadUncited = 0;
  let uncorresponded = 0;
  for (const category of categories) {
    if (!isRecord(category) || !Array.isArray(category.facts)) continue;
    for (const fact of category.facts) {
      if (!isRecord(fact)) continue;
      const sourceUrl = fact.sourceUrl;
      if (!isRetrievableCitation(sourceUrl)) {
        payloadUncited += 1;
        continue;
      }
      if (
        evidence.sourceInventory.length > 0 &&
        typeof sourceUrl === "string" &&
        !correspondsToInventory(sourceUrl, evidence.sourceInventory)
      ) {
        uncorresponded += 1;
      }
    }
  }
  if (payloadUncited > 0) {
    if (classification === "verified-research") classification = "unattributed";
    reasons.push(
      `${payloadUncited} published claim${payloadUncited === 1 ? " has" : "s have"} no retrievable citation in the record.`,
    );
  }
  if (uncorresponded > 0) {
    if (classification === "verified-research") classification = "uncorresponded";
    reasons.push(
      `${uncorresponded} published claim${uncorresponded === 1 ? " cites" : "s cite"} a source that isn't part of this record's research inventory. Cited sources must come from the recorded research.`,
    );
  }

  const verdict = isRecord(result.verdict) ? result.verdict : null;
  if (!verdict || typeof verdict.summary !== "string" || verdict.summary.trim().length === 0) {
    if (classification === "verified-research") classification = "incomplete";
    reasons.push("The verdict hasn't been generated yet.");
  }

  const sources = Array.isArray(result.sources) ? result.sources : [];
  const retrievable = sources.filter((source) =>
    isRecord(source) && isRetrievableCitation(source.url),
  );
  if (retrievable.length === 0) {
    if (classification === "verified-research") classification = "incomplete";
    reasons.push("There are no retrievable sources to inspect.");
  }

  return { eligible: reasons.length === 0, classification, reasons };
}

/**
 * Backwards-compatible name for the publish gate. Eligibility is exactly
 * the privacy assessment; there is no weaker "publishable" state.
 */
export const assessPublishEligibility = assessPublishPrivacy;
