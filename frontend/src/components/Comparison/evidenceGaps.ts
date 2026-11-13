import type { ComparisonData } from "./types";

export type Gap = {
  kind: "missing-both" | "missing" | "weak" | "uncited" | "contradiction";
  title: string;
  detail: string;
  question: string;
};

const LOW_CONFIDENCE = 0.6;

export function deriveEvidenceGaps(result: ComparisonData): Gap[] {
  const gaps: Gap[] = [];
  const { a, b } = result.entities;

  for (const category of result.categories) {
    const facts = category.facts ?? [];
    const factsA = facts.filter((fact) => fact.entity === "a");
    const factsB = facts.filter((fact) => fact.entity === "b");

    if (facts.length === 0) {
      gaps.push({
        kind: "missing-both",
        title: `No evidence for either option on ${category.name}`,
        detail: `Research returned no sourced claims for ${a.name} or ${b.name} in this category — the verdict here rests on nothing retrievable.`,
        question: `What sourced evidence exists for ${a.name} and ${b.name} on ${category.name}?`,
      });
      continue;
    }

    if (factsA.length === 0 || factsB.length === 0) {
      const missing = factsA.length === 0 ? a.name : b.name;
      const present = factsA.length === 0 ? b.name : a.name;
      const presentCount = factsA.length === 0 ? factsB.length : factsA.length;
      gaps.push({
        kind: "missing",
        title: `No ${category.name} evidence for ${missing}`,
        detail: `${present} has ${presentCount} sourced claim${presentCount === 1 ? "" : "s"} here; ${missing} has none, so this category is one-sided.`,
        question: `What sourced evidence exists for ${missing} on ${category.name}? Compare it against ${present}.`,
      });
    }

    const uncited = facts.filter((fact) => !fact.sourceUrl?.trim());
    if (uncited.length > 0) {
      const labels = uncited.slice(0, 2).map((fact) => fact.label).join(", ");
      gaps.push({
        kind: "uncited",
        title: `Claims without retrievable citations in ${category.name}`,
        detail: `${uncited.length} claim${uncited.length === 1 ? "" : "s"} (${labels}${uncited.length > 2 ? "…" : ""}) name a source but link nowhere retrievable — treat them as assertions, not evidence.`,
        question: `Can you provide retrievable sources for the ${category.name} claims about ${a.name} and ${b.name} that currently lack citations?`,
      });
    }

    const weak = facts.filter(
      (fact) => typeof fact.confidence === "number" && fact.confidence < LOW_CONFIDENCE,
    );
    if (weak.length > 0) {
      const labels = weak.slice(0, 2).map((fact) => fact.label).join(", ");
      gaps.push({
        kind: "weak",
        title: `Weakly supported ${category.name} claims`,
        detail: `${weak.length} claim${weak.length === 1 ? "" : "s"} here score below ${Math.round(LOW_CONFIDENCE * 100)} on the pipeline's support score — which is not a probability of being right (${labels}${weak.length > 2 ? "…" : ""}).`,
        question: `What stronger evidence supports or refutes the ${category.name} claims for ${a.name} and ${b.name}?`,
      });
    }
  }

  for (const contradiction of result.contradictions ?? []) {
    gaps.push({
      kind: "contradiction",
      title: "Sources disagree",
      detail: contradiction,
      question: `Can you reconcile this conflicting evidence and say which source is more reliable: ${contradiction}`,
    });
  }

  return gaps;
}
