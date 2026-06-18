import React from "react";
import { Search, Sparkles, ArrowRight } from "lucide-react";

interface HeroProps {
  heroRef: React.RefObject<HTMLDivElement>;
  query: string;
  setQuery: (q: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  queryIntent: {
    canStart: boolean;
    confidence: number;
    categoryLabel?: string;
    message: string;
    suggestion?: string;
  };
  quickStartComparisons: string[];
  handleQuickStart: (q: string) => void;
  featuredComparisons: Array<{
    label: string;
    category: string;
    sourceRequirement: string;
  }>;
}

export const Hero: React.FC<HeroProps> = ({
  heroRef,
  query,
  setQuery,
  handleSearch,
  queryIntent,
  quickStartComparisons,
  handleQuickStart,
  featuredComparisons,
}) => {
  return (
    <div ref={heroRef} className="flex flex-col items-center text-center pb-24 relative perspective-1000">
      <div className="hero-badge mb-6 flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 transform-style-3d shadow-[0_0_38px_rgba(234,88,12,0.12)]">
        <Sparkles className="h-3 w-3" />
        Sources checked before verdicts
      </div>

      <h1 className="parallax-title max-w-4xl font-serif text-5xl tracking-tight text-white md:text-7xl leading-[1.1] transform-style-3d">
        Compare with receipts. <span className="bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent italic font-light pr-2">Decide with confidence.</span>
      </h1>

      <p className="parallax-desc mt-6 max-w-2xl text-lg text-white/50 font-light leading-relaxed transform-style-3d">
        SideBy turns messy research into an evidence map: sources, facts, scoring dimensions, and a verdict you can audit before you act.
      </p>

      <form onSubmit={handleSearch} className="hero-search mt-10 w-full max-w-2xl group transform-translate-z-10">
        <div className="hero-search-shell relative rounded-sm border border-transparent">
          <div className="pointer-events-none absolute left-0 top-0 flex h-[66px] items-center pl-5">
            <Search className="h-5 w-5 text-white/30 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Supabase vs Firebase..."
            className="w-full rounded-sm border border-[#333] bg-[#0c0b0a] py-5 pl-14 pr-5 text-base text-white placeholder:text-white/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] sm:pr-36 sm:text-lg"
          />
          <button
            type="submit"
            disabled={Boolean(query.trim()) && !queryIntent.canStart}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-4 font-bold uppercase tracking-widest text-xs text-black hover:bg-[#e0e0e0] transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:absolute sm:inset-y-2 sm:right-2 sm:mt-0 sm:w-auto sm:py-0"
          >
            Compare <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {query.trim() && (
          <div className={[
            "mt-3 rounded-sm border px-4 py-3 text-left text-xs leading-relaxed",
            queryIntent.canStart
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80"
              : "border-amber-500/25 bg-amber-500/10 text-amber-100/80",
          ].join(" ")}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-bold uppercase tracking-widest text-[9px]">
                AI preflight - {Math.round(queryIntent.confidence * 100)}%
              </span>
              {queryIntent.categoryLabel && (
                <span className="text-[9px] uppercase tracking-widest opacity-70">
                  {queryIntent.categoryLabel}
                </span>
              )}
            </div>
            <p className="mt-1">{queryIntent.message}</p>
            {queryIntent.suggestion && (
              <button
                type="button"
                onClick={() => setQuery(queryIntent.suggestion || "")}
                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
              >
                Try: {queryIntent.suggestion}
              </button>
            )}
          </div>
        )}
      </form>

      {/* Quick-start one-click comparisons */}
      <div className="hero-featured mt-16 flex flex-col items-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Try one-click research</p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
          {quickStartComparisons.map((comp) => (
            <button
              key={comp}
              type="button"
              onClick={() => handleQuickStart(comp)}
              className="quick-start-chip rounded-full border border-white/[0.06] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {/* Starter comparisons */}
      <div className="mt-12 flex w-full max-w-5xl flex-col items-center rounded-sm border border-white/[0.08] bg-white/[0.025] px-4 py-7 shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:px-6 sm:py-8">
        <div className="mb-6 flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Starter comparisons</p>
          <p className="text-xs text-white/35">Pick one and SideBy starts the research map.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredComparisons.map((comp) => {
            return (
              <button
                key={comp.label}
                type="button"
                onClick={() => handleQuickStart(comp.label)}
                className="starter-card group relative min-h-[150px] overflow-hidden rounded-sm border border-white/[0.1] bg-[#11100e] p-5 text-left shadow-[0_14px_36px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-1 hover:border-orange-500/35 hover:bg-[#1a110a] hover:shadow-[0_0_34px_rgba(234,88,12,0.1)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/70">{comp.category}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Policy mapped</span>
                </div>
                <p className="font-serif text-lg text-[#fdfbf7] mb-2 group-hover:text-orange-400 transition-colors">
                  {comp.label}
                </p>
                <p className="text-xs leading-relaxed text-white/50">{comp.sourceRequirement}</p>
                <div className="absolute bottom-4 right-4 opacity-35 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4 text-orange-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
