import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ShareButton } from "@/components/ShareModal";
import { colors } from "@/config/brand";
import { EntityCard } from "./EntityCard";
import type { ComparisonData } from "./types";

interface ComparisonHeaderProps {
  result: ComparisonData;
  onRefresh: () => void;
  comparisonId?: string | null;
}

export const ComparisonHeader = ({
  result,
  onRefresh,
  comparisonId,
}: ComparisonHeaderProps) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Top bar elements
    tl.from(".ch-top-item", {
      y: -20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
    });

    // The dramatic VS reveal
    tl.from(".ch-entity-a", {
      x: -50,
      opacity: 0,
      duration: 1,
      ease: "expo.out",
    }, "-=0.4");
    
    tl.from(".ch-vs", {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.7)",
    }, "-=0.8");

    tl.from(".ch-entity-b", {
      x: 50,
      opacity: 0,
      duration: 1,
      ease: "expo.out",
    }, "-=0.8");

    // Verdict box
    tl.from(".ch-verdict-line", {
      scaleY: 0,
      transformOrigin: "top",
      duration: 0.6,
      ease: "power2.out",
    }, "-=0.4");

    tl.from(".ch-verdict-content", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out",
    }, "-=0.4");

    // Entity Cards
    tl.from(".ch-card", {
      y: 40,
      opacity: 0,
      stagger: 0.2,
      duration: 1,
      ease: "power3.out",
    }, "-=0.6");

  }, { scope: container });

  return (
    <div ref={container}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="ch-top-item flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Fresh {result.updatedAt}
          </span>
          <span className="ch-top-item text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
            {result.sourceCount} verified sources
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="ch-top-item">
            <ShareButton
              entityA={result.entities.a.name}
              entityB={result.entities.b.name}
              slug={result.slug}
              comparisonId={comparisonId}
              className="rounded-sm border border-[#2a2a2a] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#444] text-[#fdfbf7]"
            />
          </div>
          <button
            onClick={onRefresh}
            className="ch-top-item flex items-center gap-2 rounded-sm border border-[#2a2a2a] bg-[#111] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-all hover:bg-[#1a1a1a] hover:border-[#444]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-baseline md:justify-between overflow-hidden py-2">
        <h2 className="font-serif text-5xl text-[#fdfbf7] sm:text-6xl md:text-7xl leading-none tracking-tight flex items-baseline">
          <span className="ch-entity-a inline-block" style={{ color: colors.entityA }}>
            {result.entities.a.name}
          </span>
          <span className="ch-vs mx-4 font-serif italic font-light text-[#fdfbf7]/30 text-4xl sm:text-5xl inline-block">
            vs
          </span>
          <span className="ch-entity-b inline-block" style={{ color: colors.entityB }}>
            {result.entities.b.name}
          </span>
        </h2>
      </div>

      <div className="mb-12 relative pl-6 py-2">
        {/* Animated left border line */}
        <div className="ch-verdict-line absolute left-0 top-0 bottom-0 w-0.5 bg-orange-600" />
        
        <div className="ch-verdict-content">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">
            Executive Verdict
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-[#fdfbf7]/90 font-serif">
            {result.verdict.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="ch-card"><EntityCard entity={result.entities.a} side="a" /></div>
        <div className="ch-card"><EntityCard entity={result.entities.b} side="b" /></div>
      </div>
    </div>
  );
};