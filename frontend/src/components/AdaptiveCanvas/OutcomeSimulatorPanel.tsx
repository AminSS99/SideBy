import React, { useMemo } from "react";
import {
  Compass,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Sparkles,
  Search,
  Scale,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  simulateOutcomeFlips,
  type DimensionItem,
  type OutcomeFlipScenario,
} from "@/lib/adaptive-canvas/tradeoff-engine";
import type { Entity } from "@/components/Comparison/types";

interface OutcomeSimulatorPanelProps {
  dimensions: DimensionItem[];
  weights: Record<string, number>;
  entities: { a: Entity; b: Entity };
  onApplyWeight: (subject: string, targetWeight: number) => void;
  onNavigateToFollowUp?: () => void;
}

export const OutcomeSimulatorPanel: React.FC<OutcomeSimulatorPanelProps> = ({
  dimensions,
  weights,
  entities,
  onApplyWeight,
  onNavigateToFollowUp,
}) => {
  const scenarios: OutcomeFlipScenario[] = useMemo(() => {
    return simulateOutcomeFlips(dimensions, weights, entities.a.name, entities.b.name);
  }, [dimensions, weights, entities]);

  const reweightingScenarios = useMemo(() => {
    return scenarios.filter((s) => s.kind === "reweighting");
  }, [scenarios]);

  const assumptionScenarios = useMemo(() => {
    return scenarios.filter((s) => s.kind === "assumption-shift");
  }, [scenarios]);

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-7 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#fffaf1]">
            What Would Change the Outcome?
          </h3>
          <p className="text-xs text-white/50">
            Interactive sensitivity exploration. Distinguishes personal priority shifts from assumption shifts and new research requests.
          </p>
        </div>
      </div>

      {/* 3 Categories Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            1. Priority Re-weighting
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Local mathematical recalculation using current verified findings.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <Scale className="h-4 w-4 text-sky-400" />
            2. Assumption Testing
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Hypothetical sensitivity analysis if an attribute performance differs from docs.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <Search className="h-4 w-4 text-emerald-400" />
            3. New Targeted Research
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Retrieving additional crawling sources to substantiate close or contradictory claims.
          </p>
        </div>
      </div>

      {/* Re-weighting Scenarios */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-orange-400/90 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          High-Leverage Priority Shifts
        </div>

        {reweightingScenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reweightingScenarios.slice(0, 4).map((scenario) => {
              const projectedWinner =
                scenario.projectedWinner === "a"
                  ? entities.a.name
                  : scenario.projectedWinner === "b"
                  ? entities.b.name
                  : "Dead Heat";

              return (
                <div
                  key={scenario.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/95">{scenario.title}</span>
                      <span className="text-[10px] rounded bg-white/10 px-2 py-0.5 text-white/70 font-mono">
                        Lead: {projectedWinner} (+{scenario.projectedMargin} pts)
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  {typeof scenario.targetWeight === "number" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start h-7 text-xs border-white/15 bg-white/5 text-white/90 hover:bg-orange-500/20 hover:text-orange-300 hover:border-orange-500/30"
                      onClick={() => onApplyWeight(scenario.dimensionSubject, scenario.targetWeight!)}
                    >
                      Apply this weight ({scenario.targetWeight}x)
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.01] p-4 text-xs text-white/50">
            No single priority weight adjustment decisively reverses the current outcome; the leading option holds broad concordance across criteria.
          </div>
        )}
      </div>

      {/* Assumption Sensitivity Scenarios */}
      {assumptionScenarios.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-400/90 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Hypothetical Performance Sensitivity
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assumptionScenarios.slice(0, 2).map((scenario) => (
              <div
                key={scenario.id}
                className="rounded-xl border border-white/10 bg-white/[0.015] p-4 space-y-1.5"
              >
                <div className="text-xs font-semibold text-white/90">{scenario.title}</div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {scenario.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger New Research */}
      {onNavigateToFollowUp && (
        <div className="rounded-xl border border-white/10 bg-emerald-500/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-emerald-400" />
              Need fresh or deeper evidence on close criteria?
            </div>
            <p className="text-[11px] text-white/50">
              Trigger a rate-limited follow-up inquiry to retrieve additional citations on specific dimensions.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs shrink-0"
            onClick={onNavigateToFollowUp}
          >
            Ask Follow-up Question
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
