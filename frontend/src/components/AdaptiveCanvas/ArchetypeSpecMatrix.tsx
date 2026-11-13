import React from "react";
import {
  Terminal,
  Cpu,
  Layers,
  ExternalLink,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
} from "@/components/icons";
import type { ComparisonData, ComparisonFact, Entity } from "@/components/Comparison/types";
import type { ComparisonArchetype } from "@/lib/adaptive-canvas/presentation-spec";

interface ArchetypeSpecMatrixProps {
  comparison: ComparisonData;
  archetype: ComparisonArchetype;
  onSelectFact: (fact: ComparisonFact, categoryName: string) => void;
}

/**
 * Regex helper to detect and extract numeric values with units in hardware/device specs
 * (e.g. "3582 mAh", "120 Hz", "48 MP", "256 GB", "6.3 inch", "199 g", "27 hrs").
 */
const UNIT_REGEX = /\b(\d+(?:\.\d+)?)\s*(mah|hours?|hrs?|g|kg|mm|cm|inches?|in|"|hz|mp|w|gb|tb|nits|ppi|fps|k)\b/i;

function extractUnitBadge(value: string): string | null {
  const match = value.match(UNIT_REGEX);
  return match ? match[0] : null;
}

export const ArchetypeSpecMatrix: React.FC<ArchetypeSpecMatrixProps> = ({
  comparison,
  archetype,
  onSelectFact,
}) => {
  const { entities, categories } = comparison;

  // 1. Software Archetype: Technical Capability Grouping & Trade-off Emphasis
  if (archetype === "software-services") {
    return (
      <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#fffaf1]">
              Technical Architecture & Capability Groupings
            </h3>
            <p className="text-xs text-white/50">
              Evaluated across runtime standards, API ergonomics, and developer characteristics.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((category) => {
            const factsA = category.facts.filter((f) => f.entity === "a");
            const factsB = category.facts.filter((f) => f.entity === "b");

            return (
              <div
                key={category.name}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.015]"
              >
                {/* Capability Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <span className="font-serif text-sm font-semibold text-white/95">
                      {category.name}
                    </span>
                    <p className="text-xs text-white/50 mt-0.5">{category.verdict}</p>
                  </div>
                  {category.winner !== "tie" ? (
                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                      Advantage: {entities[category.winner].name}
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/40 self-start sm:self-auto">
                      Balanced Trade-off
                    </span>
                  )}
                </div>

                {/* Side-by-Side Architectural Approaches */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 p-4 gap-4">
                  {/* Entity A Technical Implementation */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: entities.a.hex || "#ea580c" }}
                      >
                        {entities.a.mark}
                      </span>
                      <span>{entities.a.name} Implementation</span>
                    </div>

                    <div className="space-y-2">
                      {factsA.length > 0 ? (
                        factsA.map((fact, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onSelectFact(fact, category.name)}
                            className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all group"
                          >
                            <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                              <span className="font-medium group-hover:text-orange-400 transition-colors">
                                {fact.label}
                              </span>
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                {fact.source}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </span>
                            </div>
                            <p className="text-xs text-white/90 leading-relaxed font-normal">
                              {fact.value}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="text-xs text-white/30 italic p-2">
                          No specific {category.name} claims documented for {entities.a.name}.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entity B Technical Implementation */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: entities.b.hex || "#0284c7" }}
                      >
                        {entities.b.mark}
                      </span>
                      <span>{entities.b.name} Implementation</span>
                    </div>

                    <div className="space-y-2">
                      {factsB.length > 0 ? (
                        factsB.map((fact, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onSelectFact(fact, category.name)}
                            className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-sky-500/30 hover:bg-sky-500/[0.03] transition-all group"
                          >
                            <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                              <span className="font-medium group-hover:text-sky-400 transition-colors">
                                {fact.label}
                              </span>
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                {fact.source}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </span>
                            </div>
                            <p className="text-xs text-white/90 leading-relaxed font-normal">
                              {fact.value}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="text-xs text-white/30 italic p-2">
                          No specific {category.name} claims documented for {entities.b.name}.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Products / Devices Archetype: Attribute Grouping with Structured Units
  if (archetype === "products-devices") {
    return (
      <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#fffaf1]">
              Hardware Specifications & Component Breakdown
            </h3>
            <p className="text-xs text-white/50">
              Direct physical specifications and documented benchmarks with extracted units.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((category) => {
            const factsA = category.facts.filter((f) => f.entity === "a");
            const factsB = category.facts.filter((f) => f.entity === "b");

            return (
              <div
                key={category.name}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.015]"
              >
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="font-serif text-sm font-semibold text-white/95">
                    {category.name} Specifications
                  </span>
                  {category.winner !== "tie" && (
                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Edge: {entities[category.winner].name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 p-4 gap-4">
                  {/* Entity A Specs */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 mb-2">
                      {entities.a.name}
                    </div>
                    {factsA.map((fact, i) => {
                      const unitBadge = extractUnitBadge(fact.value);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSelectFact(fact, category.name)}
                          className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-emerald-500/30 transition-all group flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-white/60 group-hover:text-emerald-400 transition-colors">
                              {fact.label}
                            </div>
                            <div className="text-xs text-white/90 leading-snug">
                              {fact.value}
                            </div>
                          </div>
                          {unitBadge && (
                            <span className="shrink-0 rounded bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                              {unitBadge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Entity B Specs */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 mb-2">
                      {entities.b.name}
                    </div>
                    {factsB.map((fact, i) => {
                      const unitBadge = extractUnitBadge(fact.value);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSelectFact(fact, category.name)}
                          className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-sky-500/30 transition-all group flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-white/60 group-hover:text-sky-400 transition-colors">
                              {fact.label}
                            </div>
                            <div className="text-xs text-white/90 leading-snug">
                              {fact.value}
                            </div>
                          </div>
                          {unitBadge && (
                            <span className="shrink-0 rounded bg-sky-500/15 border border-sky-500/25 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                              {unitBadge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. General Archetype: Readable Priorities & Evidence Overview
  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-7 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#fffaf1]">
            Multi-Criteria Decision Attributes
          </h3>
          <p className="text-xs text-white/50">
            Attributed claims and source lineage arranged by evaluated category.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div
            key={category.name}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.015]"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="font-serif text-sm font-semibold text-white/95">
                {category.name}
              </span>
              <span className="text-xs text-white/50">
                {category.facts.length} verified claims
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.facts.map((fact, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectFact(fact, category.name)}
                  className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-amber-500/30 transition-all group space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span className="font-semibold text-white/80 group-hover:text-amber-300 transition-colors">
                      {entities[fact.entity].name}: {fact.label}
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      {fact.source}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-normal">
                    {fact.value}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
