import React, { useRef } from "react";
import {
  Sparkles,
  Trophy,
  Scale,
  Compass,
  FileText,
  Sliders,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { ComparisonData } from "@/components/Comparison/types";
import type { AdaptivePresentationSpec } from "@/lib/adaptive-canvas/presentation-spec";

interface CanvasHeroHeaderProps {
  comparison: ComparisonData;
  spec: AdaptivePresentationSpec;
  activeView: "overview" | "tradeoffs" | "flips" | "evidence";
  onSelectView: (view: "overview" | "tradeoffs" | "flips" | "evidence") => void;
  onToggleClassicMode: () => void;
}

export const CanvasHeroHeader: React.FC<CanvasHeroHeaderProps> = ({
  comparison,
  spec,
  activeView,
  onSelectView,
  onToggleClassicMode,
}) => {
  const { entities, verdict, dimensions, sources } = comparison;

  const tabRefs = useRef<Record<"overview" | "tradeoffs" | "flips" | "evidence", HTMLButtonElement | null>>({
    overview: null,
    tradeoffs: null,
    flips: null,
    evidence: null,
  });

  const TABS = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: Layers,
      activeClass: "bg-white/15 text-white shadow",
    },
    {
      id: "tradeoffs" as const,
      label: "Tune Priorities",
      icon: Sliders,
      activeClass: "bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow",
    },
    {
      id: "flips" as const,
      label: "What Would Change It?",
      icon: Compass,
      activeClass: "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow",
    },
    {
      id: "evidence" as const,
      label: "Specifications & Evidence",
      icon: FileText,
      activeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow",
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, currentId: "overview" | "tradeoffs" | "flips" | "evidence") => {
    const tabIds: ("overview" | "tradeoffs" | "flips" | "evidence")[] = [
      "overview",
      "tradeoffs",
      "flips",
      "evidence",
    ];
    const currentIndex = tabIds.indexOf(currentId);
    let nextIndex = -1;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabIds.length;
        break;
      case "ArrowLeft":
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = tabIds.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== -1) {
      const targetId = tabIds[nextIndex];
      onSelectView(targetId);
      tabRefs.current[targetId]?.focus();
    }
  };

  const badgeToneClass =
    spec.visualEmphasis.badgeTone === "indigo"
      ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
      : spec.visualEmphasis.badgeTone === "emerald"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : spec.visualEmphasis.badgeTone === "amber"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-slate-500/15 text-slate-300 border-slate-500/30";

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0d0b0a]/90 p-5 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeToneClass}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {spec.visualEmphasis.badgeText}
          </span>
          <span className="text-xs text-white/40 hidden sm:inline">
            Adaptive Decision Canvas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleClassicMode}
            className="h-7 text-xs text-white/50 hover:text-white hover:bg-white/10"
          >
            Switch to Classic View
          </Button>
        </div>
      </div>

      {/* Main Title & Entities Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Entities Presentation */}
        <div className="lg:col-span-7 space-y-4">
          <h1 className="font-serif text-2xl sm:text-4xl tracking-tight text-[#fffaf1]">
            {entities.a.name}{" "}
            <span className="text-white/30 font-sans font-light text-xl sm:text-3xl">vs</span>{" "}
            {entities.b.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl">
            {spec.tagline}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Entity A Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow"
                style={{ backgroundColor: entities.a.hex || "#ea580c" }}
              >
                {entities.a.mark}
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-sm text-white/95 truncate">
                  {entities.a.name}
                </div>
                <div className="text-[11px] text-white/40 truncate">
                  {entities.a.subtitle}
                </div>
              </div>
            </div>

            {/* Entity B Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow"
                style={{ backgroundColor: entities.b.hex || "#0284c7" }}
              >
                {entities.b.mark}
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-sm text-white/95 truncate">
                  {entities.b.name}
                </div>
                <div className="text-[11px] text-white/40 truncate">
                  {entities.b.subtitle}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recommendation Hero Callout */}
        <div className="lg:col-span-5 rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
            <Trophy className="h-4 w-4" />
            Executive Verdict
          </div>
          <div className="text-lg font-serif text-[#fffaf1] leading-snug">
            {verdict.bestOverall}
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            {verdict.summary}
          </p>

          <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[11px] text-white/50">
            <span>{dimensions.length} criteria evaluated</span>
            <span>•</span>
            <span>{sources.length} sources crawled</span>
          </div>
        </div>
      </div>

      {/* Interactive Navigation Bar (ARIA Tablist with roving tabindex & keyboard navigation) */}
      <div
        role="tablist"
        aria-label="Adaptive canvas views"
        aria-orientation="horizontal"
        className="flex items-center gap-1.5 overflow-x-auto border-t border-white/10 pt-4 scrollbar-none"
      >
        {TABS.map((tab) => {
          const isSelected = activeView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              id={`adaptive-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`adaptive-panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelectView(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                isSelected
                  ? tab.activeClass
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
