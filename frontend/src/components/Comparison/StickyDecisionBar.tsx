import React, { useMemo } from "react";
import { Trophy, ArrowDown, X, ShieldCheck, Globe, Clock } from "lucide-react";
import type { ComparisonData } from "./types";
import { cn } from "@/lib/utils";

interface StickyDecisionBarProps {
  result: ComparisonData;
  onScrollToEvidence: () => void;
  onDismiss: () => void;
}

export function StickyDecisionBar({
  result,
  onScrollToEvidence,
  onDismiss,
}: StickyDecisionBarProps) {
  // Compute average confidence score
  const avgConfidence = useMemo(() => {
    const allFacts = result.categories.flatMap((c) => c.facts || []);
    if (allFacts.length === 0) return 85; // fallback midpoint
    const sum = allFacts.reduce((acc, f) => acc + (f.confidence || 0.8), 0);
    return Math.round((sum / allFacts.length) * 100);
  }, [result]);

  const freshnessLabel = useMemo(() => {
    // Map database taxonomy/freshness metrics
    const classVal = result.taxonomy?.freshnessClass || "medium";
    if (classVal === "volatile") return "Real-time";
    if (classVal === "medium") return "Recent";
    return "Stable";
  }, [result]);

  return (
    <aside aria-label="Decision summary" className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] left-3 right-3 z-40 flex items-center justify-between gap-2 rounded-2xl border border-orange-300/15 bg-[#0b0908]/92 p-2.5 shadow-[0_20px_55px_rgba(0,0,0,.7)] backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 sm:bottom-6 sm:left-1/2 sm:right-auto sm:min-w-[700px] sm:max-w-3xl sm:-translate-x-1/2 sm:p-3.5 sm:px-5 md:z-[60]">
      {/* Metrics Section */}
      <div className="flex min-w-0 items-center gap-x-4 text-left">
        {/* Winner HUD */}
        <div className="flex min-w-0 items-center gap-2 sm:border-r sm:border-white/[0.08] sm:pr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-orange-500/80 block">
              Best Overall
            </span>
            <span className="block max-w-[130px] truncate font-serif text-sm font-bold leading-none text-white sm:max-w-[180px]">
              {result.verdict.bestOverall}
            </span>
          </div>
        </div>

        {/* Confidence metric */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">
              Confidence
            </span>
            <span className="text-xs font-mono font-bold text-white leading-none block mt-0.5">
              {avgConfidence}%
            </span>
          </div>
        </div>

        {/* Sources count metric */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">
              Sources
            </span>
            <span className="text-xs font-mono font-bold text-white leading-none block mt-0.5">
              {result.sourceCount || result.sources.length} check
            </span>
          </div>
        </div>

        {/* Freshness metric */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">
              Freshness
            </span>
            <span className="text-xs font-sans font-bold text-white leading-none block mt-0.5">
              {freshnessLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onScrollToEvidence}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3 text-[9px] font-bold uppercase tracking-wider text-white transition hover:brightness-110 sm:flex-initial sm:px-4 sm:text-[10px]"
        >
          <span className="sm:hidden">Evidence</span><span className="hidden sm:inline">Scroll to evidence</span>
          <ArrowDown className="h-3 w-3" />
        </button>

        <button
          onClick={onDismiss}
          aria-label="Dismiss decision bar"
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-transparent text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          title="Dismiss decision bar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
