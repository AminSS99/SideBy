import React, { useMemo } from "react";
import { Trophy, ArrowDown, X, ShieldCheck, Globe, Clock } from "@/components/icons";
import { motion } from "framer-motion";
import type { ComparisonData } from "./types";
import { useT } from "@/i18n";

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
  const t = useT();
  // Compute average confidence score
  const avgConfidence = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const c of result.categories) {
      if (!c.facts) continue;
      for (const f of c.facts) {
        sum += f.confidence ?? 0.8;
        count++;
      }
    }
    if (count === 0) return 85; // fallback midpoint
    return Math.round((sum / count) * 100);
  }, [result]);

  const freshnessLabel = useMemo(() => {
    // Map database taxonomy/freshness metrics
    const classVal = result.taxonomy?.freshnessClass || "medium";
    if (classVal === "volatile") return t("res.bar.realtime");
    if (classVal === "medium") return t("res.bar.recent");
    return t("res.bar.stable");
  }, [result, t]);

  return (
    <motion.aside
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      aria-label={t("res.bar.aria")}
      className="fixed bottom-[calc(var(--sideby-toast-offset,var(--bottom-overlay-clearance,1rem))+0.5rem)] inset-x-3 mx-auto z-40 flex items-center justify-between gap-2 rounded-2xl border border-orange-500/25 bg-[#0b0908]/95 p-2.5 shadow-[0_20px_55px_rgba(0,0,0,.75)] backdrop-blur-2xl lg:bottom-6 sm:inset-x-4 sm:w-[min(700px,calc(100vw-2rem))] sm:max-w-3xl sm:p-3.5 sm:px-5 md:z-[60]"
    >
      {/* Metrics Section */}
      <div className="flex min-w-0 items-center gap-x-4 text-left">
        {/* Winner HUD */}
        <div className="flex min-w-0 items-center gap-2 sm:border-r sm:border-white/[0.08] sm:pr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-orange-500/80 block">
              {t("res.bar.best")}
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
              {t("res.bar.confidence")}
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
              {t("res.bar.sources")}
            </span>
            <span className="text-xs font-mono font-bold text-white leading-none block mt-0.5">
              {t("res.bar.checked", { count: result.sourceCount || result.sources.length })}
            </span>
          </div>
        </div>

        {/* Freshness metric */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block">
              {t("res.bar.freshness")}
            </span>
            <span className="text-xs font-sans font-bold text-white leading-none block mt-0.5">
              {freshnessLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex shrink-0 items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={onScrollToEvidence}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3 text-[9px] font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/20 transition hover:brightness-110 sm:flex-initial sm:px-4 sm:text-[10px]"
        >
          <span className="max-w-[96px] truncate sm:hidden">{t("res.bar.evidence")}</span><span className="hidden sm:inline">{t("res.bar.scroll")}</span>
          <ArrowDown className="h-3 w-3" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDismiss}
          aria-label={t("res.bar.dismiss")}
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-transparent text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          title={t("res.bar.dismiss")}
        >
          <X className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.aside>
  );
}

