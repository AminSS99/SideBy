import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Download, Info, ShieldCheck } from "lucide-react";
import { ShareButton } from "@/components/ShareModal";
import { ExportModal } from "./ExportModal";
import { EntityCard } from "./EntityCard";
import type { ComparisonData } from "./types";

interface ComparisonHeaderProps {
  result: ComparisonData;
  onRefresh: () => void;
  comparisonId?: string | null;
}

const SplitTextChars = ({ text, className }: { text: string; className?: string }) => {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="char inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

const fallbackSlug = (a: string, b: string) =>
  `${a}-vs-${b}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "comparison";

export const ComparisonHeader = ({
  result,
  onRefresh,
  comparisonId,
}: ComparisonHeaderProps) => {
  const container = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const shareSlug = result.slug || fallbackSlug(result.entities.a.name, result.entities.b.name);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline();

      tl.from(".ch-top-item", {
        y: -14,
        opacity: 0,
        stagger: 0.08,
        duration: 0.65,
        ease: "power3.out",
      });

    tl.from(".ch-entity-a .char", {
      y: 100,
      opacity: 0,
      rotationX: -90,
      stagger: 0.02,
      duration: 0.85,
      ease: "power4.out",
    }, "-=0.6");
    
    tl.from(".ch-vs", {
      scale: 0,
      opacity: 0,
      rotation: -20,
      duration: 0.7,
      ease: "elastic.out(1.2, 0.5)",
    }, "-=0.8");

    tl.from(".ch-entity-b .char", {
      y: -100,
      opacity: 0,
      rotationX: 90,
      stagger: 0.02,
      duration: 0.85,
      ease: "power4.out",
    }, "-=0.9");

    tl.from(".ch-verdict-line", {
      scaleY: 0,
      transformOrigin: "top",
      duration: 0.7,
      ease: "expo.inOut",
    }, "-=0.5");

    tl.from(".ch-verdict-content", {
      opacity: 0,
      x: -30,
      duration: 0.7,
      ease: "power3.out",
    }, "-=0.5");

    tl.from(".ch-card", {
      y: 60,
      opacity: 0,
      scale: 0.95,
      stagger: 0.2,
      duration: 0.8,
      ease: "expo.out",
      }, "-=0.8");
    });

    return () => mm.revert();
  }, { scope: container });

  return (
    <div ref={container} className="relative break-inside-avoid">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-center sm:pb-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="ch-top-item flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Fresh {result.updatedAt}
          </span>
          <span className="ch-top-item text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
            {result.sourceCount} verified sources
          </span>
          {result.taxonomy && (
            <span className="ch-top-item inline-flex items-center gap-1.5 rounded-sm border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-orange-300">
              <ShieldCheck className="h-3 w-3" />
              {result.taxonomy.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 print-hidden">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            aria-label="Export comparison"
            className="ch-top-item flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-[10px] font-bold uppercase tracking-wider text-white/70 transition-all hover:border-orange-300/20 hover:text-orange-300"
            title="Export Report"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="ch-top-item">
            <ShareButton
              entityA={result.entities.a.name}
              entityB={result.entities.b.name}
              slug={shareSlug}
              comparisonId={comparisonId}
              className="min-h-11 rounded-xl border border-white/10 bg-white/[0.035] text-white/70 hover:border-orange-300/20 hover:bg-white/[0.06]"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh comparison facts"
            className="ch-top-item flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-[10px] font-bold uppercase tracking-wider text-white/70 transition-all hover:border-orange-300/20 hover:text-orange-300"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="mb-7 overflow-hidden py-2 perspective-1000 sm:mb-10 sm:py-4">
        <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-serif text-[clamp(2.35rem,12vw,5rem)] leading-[0.95] tracking-[-0.045em] text-[#fffaf1] sm:gap-x-5">
          <SplitTextChars 
            text={result.entities.a.name} 
            className="ch-entity-a break-words"
          />
          <span className="ch-vs inline-block font-serif text-2xl font-light italic text-orange-300/45 sm:text-4xl">
            vs
          </span>
          <SplitTextChars 
            text={result.entities.b.name} 
            className="ch-entity-b break-words"
          />
        </h2>
      </div>

      <div className="relative mb-10 overflow-hidden rounded-2xl border border-orange-300/15 bg-[radial-gradient(circle_at_10%_0%,rgba(249,115,22,.12),transparent_42%),rgba(255,255,255,.025)] p-5 break-inside-avoid sm:mb-14 sm:p-7">
        <div className="ch-verdict-line absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-orange-400 via-rose-500 to-fuchsia-500" />
        
        <div className="ch-verdict-content">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
            <span className="h-px w-6 bg-orange-400/50"></span>
            Executive Verdict
          </p>
          <p className="max-w-4xl font-serif text-lg leading-7 text-[#fffaf1]/85 sm:text-xl sm:leading-8 md:text-2xl">
            {result.verdict.summary}
          </p>
        </div>
      </div>

      {result.taxonomy?.disclaimer && (
        <div className="mb-8 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100/80 sm:mb-10">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>{result.taxonomy.disclaimer}</p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-3 break-inside-avoid sm:mb-10 sm:gap-5 md:grid-cols-2">
        <div className="ch-card perspective-1000"><EntityCard entity={result.entities.a} side="a" /></div>
        <div className="ch-card perspective-1000"><EntityCard entity={result.entities.b} side="b" /></div>
      </div>

      <ExportModal 
        isOpen={exportOpen} 
        onClose={() => setExportOpen(false)} 
        result={result} 
      />
    </div>
  );
};
