import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  ChartNoAxesCombined,
  FileCheck2,
  Globe,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

interface PipelineStage {
  id: string;
  number: string;
  label: string;
  detail: string;
  icon: typeof SearchCheck;
  sources: number;
  facts: number;
  scores: number;
  log: string;
}

const STAGES: PipelineStage[] = [
  {
    id: "gather",
    number: "01",
    label: "Gathering primary documentation",
    detail: "Official pricing tables, SLA terms & changelogs",
    icon: SearchCheck,
    sources: 6,
    facts: 9,
    scores: 0,
    log: "crawler/docs: parsed supabase.com/pricing & neon.tech/pricing",
  },
  {
    id: "verify",
    number: "02",
    label: "Cross-checking benchmark & repo claims",
    detail: "Deduplicating claims and binding source citations",
    icon: FileCheck2,
    sources: 12,
    facts: 24,
    scores: 2,
    log: "verifier/claims: linked 24 normalized facts to 12 primary URLs",
  },
  {
    id: "score",
    number: "03",
    label: "Weighting dimensions for your brief",
    detail: "Scoring branching, cold start, and predictable spend",
    icon: ChartNoAxesCombined,
    sources: 14,
    facts: 31,
    scores: 5,
    log: "scorer/matrix: evaluated 5 decision dimensions with trace IDs",
  },
];

const EVIDENCE_ROWS = [
  {
    claim: "Database branching with copy-on-write storage",
    source: "neon.tech/docs",
    verdict: "Verified · Instant",
    accent: "text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.07]",
  },
  {
    claim: "Bundled Auth, Realtime, and Edge Functions",
    source: "supabase.com/docs",
    verdict: "Verified · Built-in",
    accent: "text-orange-200 border-orange-300/20 bg-orange-400/[0.08]",
  },
  {
    claim: "Usage-based compute auto-suspend to zero",
    source: "neon.tech/pricing",
    verdict: "Cited · Primary",
    accent: "text-amber-200 border-amber-300/20 bg-amber-400/[0.07]",
  },
];

export function ResearchPreviewCard() {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(1);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STAGES.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  const activeStage = STAGES[activeIndex];
  const progressPercent = activeIndex === 0 ? 38 : activeIndex === 1 ? 72 : 96;

  return (
    <div
      aria-label="Interactive research pipeline preview"
      className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.11] bg-[#0c0a09]/95 p-5 shadow-[0_32px_90px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.07)] sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/[0.10] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-rose-500/[0.08] blur-3xl"
      />

      {/* Top status bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            {!prefersReducedMotion && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            )}
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-400" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">
            Research in progress
          </span>
          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/65">
            Sample trace
          </span>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 font-mono text-xs text-white/75"
        >
          <span>Step {activeStage.number}/03</span>
          <span className="text-white/30">·</span>
          <span className="text-orange-300 font-semibold">{progressPercent}%</span>
        </div>
      </div>

      {/* Brief title & live counters */}
      <div className="relative mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-white/60">Active decision brief</p>
          <p className="mt-0.5 font-serif text-xl text-[#fffaf1] sm:text-2xl">
            Supabase vs Neon for production Postgres
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-[230px]">
          <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              Sources
            </span>
            <span className="mt-0.5 block font-mono text-base font-bold text-white tabular-nums">
              {activeStage.sources}
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              Facts
            </span>
            <span className="mt-0.5 block font-mono text-base font-bold text-white tabular-nums">
              {activeStage.facts}
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              Scores
            </span>
            <span className="mt-0.5 block font-mono text-base font-bold text-white tabular-nums">
              {activeStage.scores}
            </span>
          </div>
        </div>
      </div>

      {/* Smooth progress bar */}
      <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Interactive stage selector */}
      <div
        role="tablist"
        aria-label="Research pipeline stages"
        className="relative mt-5 grid gap-2 sm:grid-cols-3"
      >
        {STAGES.map((stage, idx) => {
          const isActive = idx === activeIndex;
          const isCompleted = idx < activeIndex;
          const StageIcon = stage.icon;
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIndex(idx)}
              className={`group flex min-h-12 flex-col justify-between rounded-xl border p-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.99] ${
                isActive
                  ? "border-orange-300/35 bg-gradient-to-br from-orange-400/[0.13] to-rose-500/[0.05] shadow-[inset_2px_0_0_0_#fb923c]"
                  : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.18] hover:bg-white/[0.045]"
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold text-white/60">
                  {stage.number}
                </span>
                {isCompleted ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <StageIcon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-orange-300" : "text-white/50 group-hover:text-white/75"
                    }`}
                  />
                )}
              </div>
              <p
                className={`mt-2 text-xs font-semibold leading-snug ${
                  isActive ? "text-[#fffaf1]" : "text-white/75"
                }`}
              >
                {stage.label}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-white/60">{stage.detail}</p>
            </button>
          );
        })}
      </div>

      {/* Sourced claims ledger */}
      <div className="relative mt-5 rounded-2xl border border-white/[0.08] bg-black/35 p-3.5 sm:p-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/75">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-300" />
            Verified evidence ledger
          </span>
          <span className="font-mono text-[11px] text-white/60">Every claim keeps its URL</span>
        </div>

        <div className="space-y-2">
          {EVIDENCE_ROWS.map((row) => (
            <div
              key={row.claim}
              className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#fffaf1]">{row.claim}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-white/60">
                  <Globe className="h-3 w-3 text-white/45" />
                  {row.source}
                </p>
              </div>
              <span
                className={`inline-flex w-fit shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${row.accent}`}
              >
                {row.verdict}
              </span>
            </div>
          ))}
        </div>

        {/* Live activity log footer */}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-2.5 font-mono text-[11px] text-emerald-300/85">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={activeStage.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="truncate"
            >
              $ {activeStage.log}
            </motion.span>
          </AnimatePresence>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/55">
            Live audit
          </span>
        </div>
      </div>
    </div>
  );
}
