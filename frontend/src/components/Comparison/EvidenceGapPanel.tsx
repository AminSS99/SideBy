import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleHelp, Info, Loader2, Scale, TriangleAlert } from "lucide-react";
import { apiFetch, describeApiFailure } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import type { ComparisonData } from "./types";

/**
 * Evidence-gap planner.
 *
 * Gaps are derived from the comparison's own evidence record and labeled by
 * kind: absent on both sides, missing on one side, weakly supported, missing
 * retrievable citations, and recorded contradictions. A fact row merely
 * existing does not make its claim sourced — claims without a retrievable
 * citation are surfaced as such. Confidence numbers are support scores from
 * the pipeline, never probabilities of being right, and are labeled that way.
 *
 * Each question goes through the existing follow-up endpoint, which is
 * server-rate-limited. Asking is an explicit user action; nothing fires
 * automatically. The remaining allowance shown here is read from the live
 * usage contract, not a hardcoded plan limit.
 */

type Gap = {
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

const KIND_META = {
  "missing-both": { label: "No evidence", icon: CircleHelp, tone: "text-amber-300 border-amber-400/25 bg-amber-400/[0.07]" },
  missing: { label: "One-sided", icon: CircleHelp, tone: "text-amber-300 border-amber-400/25 bg-amber-400/[0.07]" },
  weak: { label: "Weak support", icon: TriangleAlert, tone: "text-orange-300 border-orange-400/25 bg-orange-400/[0.07]" },
  uncited: { label: "Uncited claims", icon: Info, tone: "text-sky-300 border-sky-400/25 bg-sky-400/[0.07]" },
  contradiction: { label: "Contradiction", icon: Scale, tone: "text-rose-300 border-rose-400/25 bg-rose-400/[0.07]" },
} as const;

type FollowUpResponse = { answer: string; type?: string; confidence?: number };
type FollowUpAnswer = { text: string; type?: string; confidence?: number };

function isFollowUpResponse(data: unknown): data is FollowUpResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return typeof record.answer === "string" && record.answer.length > 0;
}

export function EvidenceGapPanel({
  result,
  comparisonId,
}: {
  result: ComparisonData;
  comparisonId: string;
}) {
  const gaps = useMemo(() => deriveEvidenceGaps(result), [result]);
  const quotaQuery = useQuery({
    queryKey: ["usage-followup"],
    queryFn: async () => {
      const res = await apiFetch(buildApiUrl("/api/usage"));
      if (!res.ok) return null;
      const data = (await res.json()) as {
        usage?: { followUp?: { remaining?: number; limit?: number } };
      };
      const followUp = data.usage?.followUp;
      return typeof followUp?.remaining === "number" && typeof followUp?.limit === "number"
        ? { remaining: followUp.remaining, limit: followUp.limit }
        : null;
    },
  });
  const quota = quotaQuery.data ?? null;
  const [answers, setAnswers] = useState<Record<string, FollowUpAnswer>>({});
  const [asking, setAsking] = useState<string | null>(null);
  
  // Synchronous locks: state updates don't land before a second click can.
  const askingRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A new comparison invalidates pending and resolved gap work immediately.
  useEffect(() => {
    abortRef.current?.abort();
    askingRef.current = null;
    setAsking(null);
    setAnswers({});
  }, [comparisonId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const isIllustrative = result.provenance === "illustrative";

  if (gaps.length === 0 && result.categories.length > 0) {
    return (
      <section aria-label="Evidence gaps" className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Evidence gaps</p>
        <p className="mt-3 text-sm leading-relaxed text-[#fdfbf7]/60">
          No decision-relevant gaps detected: both options have cited, supported claims in every category, and
          no recorded contradictions remain unresolved. Silence here means "nothing found", not "everything
          proven" — research only covers what the pipeline retrieved.
        </p>
      </section>
    );
  }

  if (result.categories.length === 0) {
    return (
      <section aria-label="Evidence gaps" className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Evidence gaps</p>
        <p className="mt-3 text-sm leading-relaxed text-[#fdfbf7]/60">
          No categories were researched yet, so there is nothing to audit. Gaps will appear here once the
          research record lands.
        </p>
      </section>
    );
  }

  const ask = async (gap: Gap) => {
    if (askingRef.current) return;
    askingRef.current = gap.question;
    setAsking(gap.question);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/actions`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow-up", question: gap.question }),
        signal: controller.signal,
      });
      const data: unknown = await res.json();
      if (!isFollowUpResponse(data)) {
        throw new Error("The follow-up came back in an unexpected shape. Please try again.");
      }
      setAnswers((current) => ({
        ...current,
        [gap.question]: { text: data.answer, type: data.type, confidence: data.confidence },
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Follow-up failed", { description: describeApiFailure(error) });
    } finally {
      if (askingRef.current === gap.question) askingRef.current = null;
      setAsking((current) => (current === gap.question ? null : current));
    }
  };

  return (
    <section aria-label="Evidence gaps" className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Evidence gaps</p>
          <h3 className="mt-2 font-serif text-2xl text-[#fdfbf7]">What could change this decision</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#fdfbf7]/50">
            Unknowns and contradictions found in this comparison's own evidence.
            {quota
              ? ` ${quota.remaining} of ${quota.limit} daily follow-ups left.`
              : " Follow-ups count toward your daily allowance."}{" "}
            Asking is explicit — nothing runs automatically.
          </p>
          {isIllustrative && (
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-amber-300/90">
              This record is marked illustrative (sample data), not live research. Gaps below describe the
              sample, not a real evidence base.
            </p>
          )}
        </div>
        <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
          {gaps.length} open
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {gaps.map((gap) => {
          const meta = KIND_META[gap.kind];
          const Icon = meta.icon;
          const answer = answers[gap.question];
          const isAsking = asking === gap.question;
          return (
            <li key={`${gap.kind}-${gap.title}`} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${meta.tone}`}>
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {meta.label}
                </span>
                <p className="text-sm font-semibold text-[#fdfbf7]">{gap.title}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#fdfbf7]/55">{gap.detail}</p>

              {answer ? (
                <div className="mt-3 border-t border-[#2a2a2a] pt-3">
                  <p className="text-sm leading-relaxed text-[#fdfbf7]/85">{answer.text}</p>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
                    {answer.type === "grounded"
                      ? "Source-backed"
                      : answer.type === "inference"
                        ? "Inference"
                        : "Insufficient data"}
                    {typeof answer.confidence === "number"
                      ? ` · Support score ${Math.round(answer.confidence * 100)} (not a probability)`
                      : ""}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={Boolean(asking)}
                  onClick={() => void ask(gap)}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-sm border border-orange-500/30 bg-orange-500/10 px-3.5 text-[10px] font-bold uppercase tracking-widest text-orange-300 transition-colors hover:bg-orange-500/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  {isAsking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isAsking ? "Asking…" : "Ask follow-up"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
