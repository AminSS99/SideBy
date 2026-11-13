import React, { useState } from "react";
import {
  FileText,
  Trophy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from "@/components/icons";
import type { Category, ComparisonFact, Entity } from "@/components/Comparison/types";

interface CategoryDeepDivePanelProps {
  categories: Category[];
  entities: { a: Entity; b: Entity };
  onSelectFact: (fact: ComparisonFact, categoryName: string) => void;
  title?: string;
  description?: string;
  defaultExpanded?: boolean;
}

export const CategoryDeepDivePanel: React.FC<CategoryDeepDivePanelProps> = ({
  categories,
  entities,
  onSelectFact,
  title = "Attributed Findings & Source Citations",
  description = "Detailed category breakdown of findings, attributed facts, and retrieved citations.",
  defaultExpanded = true,
}) => {
  // Collapsible category state: all open by default if defaultExpanded is true
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of categories) {
      initial[cat.name] = defaultExpanded;
    }
    return initial;
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-8 text-center text-xs text-white/50 backdrop-blur-md">
        No category findings match the active presentation specification scope.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-7 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl tracking-tight text-[#fffaf1]">
              {title}
            </h3>
            <p className="text-xs text-white/50">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </span>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category, catIdx) => {
          const isExpanded = expandedCategories[category.name] ?? true;
          const factsA = category.facts.filter((f) => f.entity === "a");
          const factsB = category.facts.filter((f) => f.entity === "b");
          const winnerEntity =
            category.winner === "a"
              ? entities.a
              : category.winner === "b"
              ? entities.b
              : null;

          return (
            <div
              key={category.name}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.015] transition-colors hover:border-white/20"
            >
              {/* Category Header Bar */}
              <div
                className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none bg-white/[0.02]"
                onClick={() => toggleCategory(category.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory(category.name);
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={`Toggle details for category ${category.name}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[11px] font-mono font-bold text-white/50">
                    {String(catIdx + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-base font-semibold text-white/95">
                    {category.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {winnerEntity ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-0.5 text-xs font-semibold text-orange-400">
                      <Trophy className="h-3 w-3" />
                      Advantage: {winnerEntity.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs text-white/50">
                      Even / Tie
                    </span>
                  )}

                  <button
                    type="button"
                    className="text-white/40 hover:text-white"
                    aria-label={isExpanded ? "Collapse section" : "Expand section"}
                    tabIndex={-1}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="space-y-5 border-t border-white/10 p-5">
                  {/* Category Verdict / Takeaway */}
                  {category.verdict && (
                    <div className="rounded-lg border-l-2 border-orange-500 bg-white/[0.02] p-3.5 pl-4">
                      <span className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-orange-400/90 mb-1">
                        Synthesis Takeaway
                      </span>
                      <p className="text-xs sm:text-sm text-white/80 italic font-serif leading-relaxed">
                        "{category.verdict}"
                      </p>
                    </div>
                  )}

                  {/* Facts Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Entity A Facts */}
                    <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: entities.a.hex || "#ea580c" }}
                        >
                          {entities.a.mark}
                        </div>
                        <span className="text-xs font-semibold text-white/90">
                          {entities.a.name}
                        </span>
                      </div>

                      {factsA.length > 0 ? (
                        <div className="space-y-2.5">
                          {factsA.map((fact, idx) => (
                            <div
                              key={idx}
                              className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/15"
                            >
                              <div className="text-[11px] font-semibold text-white/60 mb-0.5">
                                {fact.label}
                              </div>
                              <p className="text-xs text-white/90 leading-relaxed">
                                {fact.value}
                              </p>

                              <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => onSelectFact(fact, category.name)}
                                  className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-medium transition-colors"
                                  aria-label={`Inspect source citation for ${fact.label}`}
                                >
                                  <span>{fact.source || "Retrieved Source"}</span>
                                  <ExternalLink className="h-3 w-3 opacity-70" />
                                </button>
                                {fact.freshness && (
                                  <span className="text-[10px] text-white/30">
                                    {fact.freshness}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic py-2">
                          No specific findings recorded for this category.
                        </p>
                      )}
                    </div>

                    {/* Entity B Facts */}
                    <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: entities.b.hex || "#0284c7" }}
                        >
                          {entities.b.mark}
                        </div>
                        <span className="text-xs font-semibold text-white/90">
                          {entities.b.name}
                        </span>
                      </div>

                      {factsB.length > 0 ? (
                        <div className="space-y-2.5">
                          {factsB.map((fact, idx) => (
                            <div
                              key={idx}
                              className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/15"
                            >
                              <div className="text-[11px] font-semibold text-white/60 mb-0.5">
                                {fact.label}
                              </div>
                              <p className="text-xs text-white/90 leading-relaxed">
                                {fact.value}
                              </p>

                              <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => onSelectFact(fact, category.name)}
                                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                                  aria-label={`Inspect source citation for ${fact.label}`}
                                >
                                  <span>{fact.source || "Retrieved Source"}</span>
                                  <ExternalLink className="h-3 w-3 opacity-70" />
                                </button>
                                {fact.freshness && (
                                  <span className="text-[10px] text-white/30">
                                    {fact.freshness}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic py-2">
                          No specific findings recorded for this category.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
