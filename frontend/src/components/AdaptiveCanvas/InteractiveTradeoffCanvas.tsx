import React, { useMemo } from "react";
import { Sliders, RotateCcw, Trophy, Sparkles, Scale, CheckCircle2 } from "@/components/icons";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  calculateWeightedOutcome,
  explainWinnerShift,
  CLOSE_RESULT_THRESHOLD,
  type DimensionItem,
  type WeightedOutcomeResult,
} from "@/lib/adaptive-canvas/tradeoff-engine";
import type { Entity } from "@/components/Comparison/types";

interface InteractiveTradeoffCanvasProps {
  dimensions: DimensionItem[];
  weights: Record<string, number>;
  onWeightChange: (subject: string, weight: number) => void;
  onResetWeights: () => void;
  entities: { a: Entity; b: Entity };
  onFocusEvidence?: (subject: string) => void;
}

export const InteractiveTradeoffCanvas: React.FC<InteractiveTradeoffCanvasProps> = ({
  dimensions,
  weights,
  onWeightChange,
  onResetWeights,
  entities,
  onFocusEvidence,
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Baseline equal weights (all 3)
  const baselineOutcome = useMemo(() => {
    const baseWeights: Record<string, number> = {};
    for (const d of dimensions) baseWeights[d.subject] = 3;
    return calculateWeightedOutcome(dimensions, baseWeights);
  }, [dimensions]);

  // Current weighted outcome
  const currentOutcome: WeightedOutcomeResult = useMemo(() => {
    return calculateWeightedOutcome(dimensions, weights);
  }, [dimensions, weights]);

  // Explanation of shifts
  const shiftExplanation = useMemo(() => {
    return explainWinnerShift(
      baselineOutcome,
      currentOutcome,
      dimensions,
      entities.a.name,
      entities.b.name,
    );
  }, [baselineOutcome, currentOutcome, dimensions, entities]);

  // Check if any weights diverge from 3
  const isCustomized = useMemo(() => {
    return dimensions.some((d) => (weights[d.subject] ?? 3) !== 3);
  }, [dimensions, weights]);

  // Spring animation settings for coordinated score bar motion
  const barTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 85, damping: 16 };

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-7 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-lg sm:text-2xl tracking-tight text-[#fffaf1] truncate">
              Interactive Trade-offs
            </h3>
            <p className="text-[11px] text-white/70 leading-normal">
              Adjust criteria weights. Scores reflect support evidence (0–100), not probabilities.
            </p>
          </div>
        </div>

        {/* Quick Presets & Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2.5 text-xs text-white/70 hover:text-white hover:bg-white/10"
            onClick={onResetWeights}
            disabled={!isCustomized}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restore Baseline
          </Button>
        </div>
      </div>

      {/* Live Composite Support Index Cards with Coordinated Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Entity A */}
        <div
          className={`relative overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-300 ${
            currentOutcome.winner === "a" && !currentOutcome.isCloseResult
              ? "border-orange-500/40 bg-orange-500/[0.06] shadow-[0_0_25px_rgba(249,115,22,0.1)]"
              : "border-white/15 bg-white/[0.03]"
          }`}
        >
          <div className="flex flex-col items-start gap-1.5 mb-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div className="flex min-w-0 max-w-full items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white shadow"
                style={{ backgroundColor: entities.a.hex || "#ea580c" }}
              >
                {entities.a.mark}
              </span>
              <span className="truncate font-semibold text-sm text-white/95">{entities.a.name}</span>
            </div>
            {currentOutcome.winner === "a" && !currentOutcome.isCloseResult && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-orange-300 border border-orange-500/30">
                <Trophy className="h-3 w-3" /> Priority Lead
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs text-white/70">
              <span className="truncate">Support Index</span>
              <span className="shrink-0 whitespace-nowrap font-mono font-bold text-white text-sm">
                {currentOutcome.scoreA} <span className="text-white/50 text-xs font-normal">/ 100</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${Math.min(100, Math.max(0, currentOutcome.scoreA))}%` }}
                transition={barTransition}
                style={{
                  backgroundColor: entities.a.hex || "#ea580c",
                }}
              />
            </div>
          </div>
        </div>

        {/* Entity B */}
        <div
          className={`relative overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-300 ${
            currentOutcome.winner === "b" && !currentOutcome.isCloseResult
              ? "border-sky-500/40 bg-sky-500/[0.06] shadow-[0_0_25px_rgba(56,189,248,0.1)]"
              : "border-white/15 bg-white/[0.03]"
          }`}
        >
          <div className="flex flex-col items-start gap-1.5 mb-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div className="flex min-w-0 max-w-full items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white shadow"
                style={{ backgroundColor: entities.b.hex || "#0284c7" }}
              >
                {entities.b.mark}
              </span>
              <span className="truncate font-semibold text-sm text-white/95">{entities.b.name}</span>
            </div>
            {currentOutcome.winner === "b" && !currentOutcome.isCloseResult && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-sky-300 border border-sky-500/30">
                <Trophy className="h-3 w-3" /> Priority Lead
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs text-white/70">
              <span className="truncate">Support Index</span>
              <span className="shrink-0 whitespace-nowrap font-mono font-bold text-white text-sm">
                {currentOutcome.scoreB} <span className="text-white/50 text-xs font-normal">/ 100</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${Math.min(100, Math.max(0, currentOutcome.scoreB))}%` }}
                transition={barTransition}
                style={{
                  backgroundColor: entities.b.hex || "#0284c7",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delta Explanation Box */}
      <div
        className={`rounded-xl border p-3.5 sm:p-4 text-xs leading-relaxed transition-colors ${
          currentOutcome.isCloseResult
            ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-100"
            : "border-white/15 bg-white/[0.03] text-white/90"
        }`}
      >
        <div className="flex items-start gap-2.5">
          {currentOutcome.isCloseResult ? (
            <Scale className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-orange-400 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-white mb-0.5">
              {currentOutcome.isCloseResult ? "Close Result Analysis" : "Trade-off Synthesis"}
            </div>
            <p className="text-white/80 leading-normal">{shiftExplanation}</p>
          </div>
        </div>
      </div>

      {/* Dimension Sliders */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/60">
          <span>Decision Criteria</span>
          <span>Priority</span>
        </div>

        <div className="space-y-2.5">
          {dimensions.map((dim) => {
            const currentWeight = weights[dim.subject] ?? 3;
            const fullMark = dim.fullMark > 0 ? dim.fullMark : 100;
            const normA = Math.round((Math.max(0, dim.a) / fullMark) * 100);
            const normB = Math.round((Math.max(0, dim.b) / fullMark) * 100);

            return (
              <div
                key={dim.subject}
                className="group rounded-xl border border-white/10 bg-white/[0.025] p-3 hover:border-white/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2">
                  <div className="flex min-w-0 items-center justify-between sm:justify-start gap-2">
                    <span className="text-xs sm:text-sm font-medium text-white truncate" title={dim.subject}>
                      {dim.subject}
                    </span>
                    {onFocusEvidence && (
                      <button
                        type="button"
                        onClick={() => onFocusEvidence(dim.subject)}
                        className="shrink-0 text-[11px] font-medium text-orange-400 hover:text-orange-300 hover:underline"
                      >
                        Evidence
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                      <span>{entities.a.name}: <strong className="text-white/90">{normA}</strong></span>
                      <span>•</span>
                      <span>{entities.b.name}: <strong className="text-white/90">{normB}</strong></span>
                    </div>
                    <span className="inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded bg-white/15 font-mono font-bold text-white text-[11px]">
                      {currentWeight}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-white/50 font-mono shrink-0">1x<span className="hidden sm:inline"> (Low)</span></span>
                  <Slider
                    value={[currentWeight]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={(val) => onWeightChange(dim.subject, val[0] || 3)}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-white/50 font-mono shrink-0">5x<span className="hidden sm:inline"> (High)</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
