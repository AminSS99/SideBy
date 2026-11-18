import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleHelp, Info, Loader2, Scale, TriangleAlert } from "@/components/icons";
import { apiFetch, describeApiFailure } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import { deriveEvidenceGaps, type Gap } from "./evidenceGaps";
import type { ComparisonData } from "./types";
import { useT, type MessageKey, type TFunction } from "@/i18n";

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

const KIND_META: Record<Gap["kind"], { labelKey: MessageKey; icon: typeof CircleHelp; tone: string }> = {
  "missing-both": { labelKey: "dw.gaps.kind.missingBoth", icon: CircleHelp, tone: "text-amber-300 border-amber-400/25 bg-amber-400/[0.07]" },
  missing: { labelKey: "dw.gaps.kind.missing", icon: CircleHelp, tone: "text-amber-300 border-amber-400/25 bg-amber-400/[0.07]" },
  weak: { labelKey: "dw.gaps.kind.weak", icon: TriangleAlert, tone: "text-orange-300 border-orange-400/25 bg-orange-400/[0.07]" },
  uncited: { labelKey: "dw.gaps.kind.uncited", icon: Info, tone: "text-sky-300 border-sky-400/25 bg-sky-400/[0.07]" },
  contradiction: { labelKey: "dw.gaps.kind.contradiction", icon: Scale, tone: "text-rose-300 border-rose-400/25 bg-rose-400/[0.07]" },
};

function translateGap(t: TFunction, gap: Gap): { title: string; detail: string } {
  const m = gap.i18n;
  switch (gap.kind) {
    case "missing-both":
      return {
        title: m?.category ? t("dw.gaps.missingBoth.title", { category: m.category }) : gap.title,
        detail:
          m?.entityA && m?.entityB
            ? t("dw.gaps.missingBoth.detail", { a: m.entityA, b: m.entityB })
            : gap.detail,
      };
    case "missing":
      return {
        title:
          m?.category && m?.missing
            ? t("dw.gaps.missing.title", { category: m.category, missing: m.missing })
            : gap.title,
        detail:
          m?.present && m?.presentCount !== undefined && m?.missing
            ? t("dw.gaps.missing.detail", {
                present: m.present,
                count: m.presentCount,
                missing: m.missing,
              })
            : gap.detail,
      };
    case "uncited":
      return {
        title: m?.category ? t("dw.gaps.uncited.title", { category: m.category }) : gap.title,
        detail:
          m?.count !== undefined && m?.labels !== undefined
            ? t("dw.gaps.uncited.detail", { count: m.count, labels: m.labels })
            : gap.detail,
      };
    case "weak":
      return {
        title: m?.category ? t("dw.gaps.weak.title", { category: m.category }) : gap.title,
        detail:
          m?.count !== undefined && m?.threshold !== undefined && m?.labels !== undefined
            ? t("dw.gaps.weak.detail", { count: m.count, threshold: m.threshold, labels: m.labels })
            : gap.detail,
      };
    case "contradiction":
      return {
        title: t("dw.gaps.contradiction.title"),
        detail: gap.detail,
      };
  }
}

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
  const t = useT();
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
      <section aria-label={t("dw.gaps.aria")} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{t("dw.gaps.kicker")}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#fdfbf7]/60">
          {t("dw.gaps.noneFound")}
        </p>
      </section>
    );
  }

  if (result.categories.length === 0) {
    return (
      <section aria-label={t("dw.gaps.aria")} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{t("dw.gaps.kicker")}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#fdfbf7]/60">
          {t("dw.gaps.noCategories")}
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
        throw new Error(t("dw.gaps.err.unexpectedShape"));
      }
      setAnswers((current) => ({
        ...current,
        [gap.question]: { text: data.answer, type: data.type, confidence: data.confidence },
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error(t("dw.gaps.toast.failed"), { description: describeApiFailure(error) });
    } finally {
      if (askingRef.current === gap.question) askingRef.current = null;
      setAsking((current) => (current === gap.question ? null : current));
    }
  };

  return (
    <section aria-label={t("dw.gaps.aria")} className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{t("dw.gaps.kicker")}</p>
          <h3 className="mt-2 font-serif text-2xl text-[#fdfbf7]">{t("dw.gaps.title")}</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#fdfbf7]/50">
            {quota
              ? t("dw.gaps.subtitleWithQuota", { remaining: quota.remaining, limit: quota.limit })
              : t("dw.gaps.subtitleNoQuota")}
          </p>
          {isIllustrative && (
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-amber-300/90">
              {t("dw.gaps.illustrative")}
            </p>
          )}
        </div>
        <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
          {t("dw.gaps.openCount", { count: gaps.length })}
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {gaps.map((gap) => {
          const meta = KIND_META[gap.kind];
          const Icon = meta.icon;
          const answer = answers[gap.question];
          const isAsking = asking === gap.question;
          const translated = translateGap(t, gap);
          return (
            <li key={`${gap.kind}-${gap.title}`} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${meta.tone}`}>
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {t(meta.labelKey)}
                </span>
                <p className="text-sm font-semibold text-[#fdfbf7]">{translated.title}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#fdfbf7]/55">{translated.detail}</p>

              {answer ? (
                <div className="mt-3 border-t border-[#2a2a2a] pt-3">
                  <p className="text-sm leading-relaxed text-[#fdfbf7]/85">{answer.text}</p>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
                    {answer.type === "grounded"
                      ? t("dw.gaps.answer.grounded")
                      : answer.type === "inference"
                        ? t("dw.gaps.answer.inference")
                        : t("dw.gaps.answer.insufficient")}
                    {typeof answer.confidence === "number"
                      ? t("dw.gaps.answer.supportScore", { score: Math.round(answer.confidence * 100) })
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
                  {isAsking ? t("dw.gaps.asking") : t("dw.gaps.askFollowUp")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
