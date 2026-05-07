import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Download } from "lucide-react";
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
    <span className={className} style={{ display: "inline-block" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
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
    const tl = gsap.timeline();
    
    tl.from(".ch-top-item", {
      y: -20,
      opacity: 0,
      stagger: 0.1,
      duration: 1,
      ease: "expo.out",
    });

    tl.from(".ch-entity-a .char", {
      y: 100,
      opacity: 0,
      rotationX: -90,
      stagger: 0.02,
      duration: 1.2,
      ease: "power4.out",
    }, "-=0.6");
    
    tl.from(".ch-vs", {
      scale: 0,
      opacity: 0,
      rotation: -20,
      duration: 1,
      ease: "elastic.out(1.2, 0.5)",
    }, "-=0.8");

    tl.from(".ch-entity-b .char", {
      y: -100,
      opacity: 0,
      rotationX: 90,
      stagger: 0.02,
      duration: 1.2,
      ease: "power4.out",
    }, "-=0.9");

    tl.from(".ch-verdict-line", {
      scaleY: 0,
      transformOrigin: "top",
      duration: 1,
      ease: "expo.inOut",
    }, "-=0.5");

    tl.from(".ch-verdict-content", {
      opacity: 0,
      x: -30,
      duration: 1,
      ease: "power3.out",
    }, "-=0.5");

    tl.from(".ch-card", {
      y: 60,
      opacity: 0,
      scale: 0.95,
      stagger: 0.2,
      duration: 1.2,
      ease: "expo.out",
    }, "-=0.8");

  }, { scope: container });

  return (
    <div ref={container} className="relative break-inside-avoid">
      <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
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
        </div>
        <div className="flex items-center gap-2 sm:gap-3 print-hidden">
          <button
            onClick={() => setExportOpen(true)}
            className="ch-top-item flex items-center gap-2 rounded-sm border border-[#2a2a2a] bg-[#111] px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-all hover:bg-[#1a1a1a] hover:border-[#444]"
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
              className="rounded-sm border border-[#2a2a2a] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#444] text-[#fdfbf7]"
            />
          </div>
          <button
            onClick={onRefresh}
            className="ch-top-item flex items-center gap-2 rounded-sm border border-[#2a2a2a] bg-[#111] px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-all hover:bg-[#1a1a1a] hover:border-[#444] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="mb-8 sm:mb-12 flex flex-col md:flex-row md:items-baseline md:justify-between overflow-hidden py-4 perspective-1000">
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] leading-none tracking-tight flex flex-col sm:flex-row sm:flex-wrap items-baseline gap-y-2 sm:gap-y-4">
          <SplitTextChars 
            text={result.entities.a.name} 
            className="ch-entity-a inline-block" 
          />
          <span className="ch-vs mx-0 sm:mx-6 my-1 sm:my-0 font-serif italic font-light text-[#fdfbf7]/20 text-3xl sm:text-4xl lg:text-5xl inline-block">
            vs
          </span>
          <SplitTextChars 
            text={result.entities.b.name} 
            className="ch-entity-b inline-block" 
          />
        </h2>
      </div>

      <div className="mb-16 relative pl-8 py-2 break-inside-avoid">
        <div className="ch-verdict-line absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-800" />
        
        <div className="ch-verdict-content">
          <p className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">
            <span className="h-px w-8 bg-orange-500/50"></span>
            Executive Verdict
          </p>
          <p className="max-w-4xl text-xl leading-relaxed text-[#fdfbf7]/90 font-serif md:text-2xl">
            {result.verdict.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 mb-8 sm:mb-10 break-inside-avoid">
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
