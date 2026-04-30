import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ComparisonFact, Entity } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface FactCardProps {
  fact: ComparisonFact;
  entity: Entity;
  index: number;
  className?: string;
}

export const FactCard = ({ fact, entity, index, className = "" }: FactCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;

    // Alternate slide direction based on entity side (a comes from left, b from right)
    const xOffset = fact.entity === 'a' ? -30 : 30;

    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
      },
      x: xOffset,
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: index * 0.1, // Stagger facts if multiple exist
    });

    // Animate the confidence gauge filling up
    if (gaugeRef.current) {
      gsap.from(gaugeRef.current, {
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
        },
        width: "0%",
        duration: 1.5,
        ease: "power4.out",
        delay: (index * 0.1) + 0.3,
      });
    }
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-sm border-t-2 p-6 transition-colors hover:bg-[#151515] bg-[#111] ${
        fact.changed
          ? "bg-[#1a1510] border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.05)]"
          : "border-[#2a2a2a]"
      } ${className}`}
      style={{ borderTopColor: fact.changed ? "#ea580c" : entity.hex }}
    >
      {/* Sweeping Glassmorphic Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-out z-0 pointer-events-none" />

      <div className="relative z-10 mb-5 flex items-start justify-between gap-3 border-b border-[#2a2a2a] pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: entity.hex }}>
            {entity.name}
          </p>
          <p className="text-base font-serif text-[#fdfbf7] mt-1">{fact.label}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[10px] font-bold tabular-nums text-[#fdfbf7]/50 uppercase tracking-widest">
            {Math.round(fact.confidence * 100)}% Conf
          </span>
          <div className="h-0.5 w-16 bg-[#2a2a2a] relative overflow-hidden">
            <div
              ref={gaugeRef}
              className="absolute left-0 top-0 h-full"
              style={{ width: `${Math.round(fact.confidence * 100)}%`, backgroundColor: entity.hex }}
            />
          </div>
        </div>
      </div>

      <p className="relative z-10 mb-6 text-sm leading-relaxed text-[#fdfbf7]/80">{fact.value}</p>

      {fact.changed && fact.previousValue && (
        <div className="relative z-10 mb-6 border-l-2 border-[#444] pl-4 py-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1.5">Previously</p>
          <p className="text-xs text-[#fdfbf7]/40 line-through">{fact.previousValue}</p>
        </div>
      )}

      <div className="relative z-10 flex flex-wrap gap-2 pt-2">
        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
          <SourcePin className="h-2.5 w-2.5" />
          {fact.source}
        </span>
        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
          <FreshnessDot freshness={fact.freshness} />
          {fact.freshness}
        </span>
        {fact.changed && (
          <span className="inline-flex items-center gap-1.5 border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-400">
            Updated
          </span>
        )}
      </div>
    </div>
  );
};

const FreshnessDot = ({ freshness }: { freshness: string }) => {
  const color =
    freshness === "Fresh"
      ? "bg-emerald-500"
      : freshness === "Monitor"
        ? "bg-amber-500"
        : "bg-[#555]";
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
};

const SourcePin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);