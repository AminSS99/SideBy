import React from "react";
import type { ComparisonFact, Entity } from "./types";

interface FactCardProps {
  fact: ComparisonFact;
  entity: Entity;
  className?: string;
}

export const FactCard = ({ fact, entity, className = "" }: FactCardProps) => (
  <div
    className={`rounded-sm border-t-2 p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-[#111] ${
      fact.changed
        ? "bg-[#1a1510] border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.1)]"
        : "border-[#2a2a2a]"
    } ${className}`}
    style={{ borderTopColor: fact.changed ? "#ea580c" : entity.hex }}
  >
    <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#2a2a2a] pb-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: entity.hex }}>
          {entity.name}
        </p>
        <p className="text-sm font-serif text-[#fdfbf7] mt-1">{fact.label}</p>
      </div>
      <ConfidenceGauge value={fact.confidence} color={entity.hex} />
    </div>

    <p className="mb-5 text-sm leading-relaxed text-[#fdfbf7]/80">{fact.value}</p>

    {fact.changed && fact.previousValue && (
      <div className="mb-5 border-l-2 border-[#444] pl-3 py-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">Previously</p>
        <p className="text-xs text-[#fdfbf7]/50 line-through">{fact.previousValue}</p>
      </div>
    )}

    <div className="flex flex-wrap gap-2 pt-2">
      <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#0c0b0a] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
        <SourcePin className="h-2.5 w-2.5" />
        {fact.source}
      </span>
      <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#0c0b0a] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
        <FreshnessDot freshness={fact.freshness} />
        {fact.freshness}
      </span>
      {fact.changed && (
        <span className="inline-flex items-center gap-1.5 border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-400">
          Updated
        </span>
      )}
    </div>
  </div>
);

const ConfidenceGauge = ({ value, color }: { value: number; color: string }) => (
  <div className="flex flex-col items-end gap-1">
    <span className="text-[10px] font-bold tabular-nums text-[#fdfbf7]/50 uppercase tracking-widest">
      {Math.round(value * 100)}% Conf
    </span>
    <div className="h-0.5 w-12 bg-[#2a2a2a] relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full confidence-bar"
        style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

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