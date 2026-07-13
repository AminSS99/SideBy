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
    <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 w-auto md:min-w-[700px] md:max-w-3xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#2a2a2a] p-3.5 sm:px-5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-5 duration-300">
      {/* Metrics Section */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-left">
        {/* Winner HUD */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#1f1f1f]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-orange-500/80 block">
              Best Overall
            </span>
            <span className="text-xs font-serif font-bold text-white leading-none block mt-0.5">
              {result.verdict.bestOverall}
            </span>
          </div>
        </div>

        {/* Confidence metric */}
        <div className="flex items-center gap-1.5">
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
        <div className="flex items-center gap-1.5">
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
        <div className="flex items-center gap-1.5">
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
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onScrollToEvidence}
          className="flex-1 sm:flex-initial h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#fdfbf7] px-4 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-[#e2e2e2] transition-colors"
        >
          Scroll to Evidence
          <ArrowDown className="h-3 w-3" />
        </button>

        <button
          onClick={onDismiss}
          aria-label="Dismiss decision bar"
          className="p-2 border border-[#1f1f1f] bg-transparent hover:bg-white/5 rounded-xl text-[#fdfbf7]/40 hover:text-white transition-colors"
          title="Dismiss decision bar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
