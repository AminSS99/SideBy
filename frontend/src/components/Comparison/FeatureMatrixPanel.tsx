import React, { useRef, useMemo, useState } from 'react';
import { Table2, Trophy, Search } from 'lucide-react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ComparisonData } from './types';
import { panelClass } from './constants';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export const FeatureMatrixPanel = ({ result }: { result: ComparisonData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");

  const matrixData = useMemo(() => {
    const term = filter.toLowerCase();
    
    return result.categories.map(cat => {
      // Pre-compute maps for O(1) lookups instead of O(N) array finds
      const factsA = new Map();
      const factsB = new Map();

      cat.facts.forEach(f => {
        if (f.entity === 'a' && !factsA.has(f.label)) factsA.set(f.label, f);
        if (f.entity === 'b' && !factsB.has(f.label)) factsB.set(f.label, f);
      });

      const labels = Array.from(new Set(cat.facts.map(f => f.label)));
      
      const rows = labels
        .filter(label => label.toLowerCase().includes(term) || cat.name.toLowerCase().includes(term))
        .map(label => {
          const factA = factsA.get(label);
          const factB = factsB.get(label);
          return { label, factA, factB };
        });

      return {
        category: cat.name,
        winner: cat.winner,
        rows
      };
    }).filter(cat => cat.rows.length > 0);
  }, [result.categories, filter]);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    gsap.from(".matrix-row", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
      },
      opacity: 0,
      y: 10,
      stagger: 0.05,
      duration: 0.5,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  if (!result.categories || result.categories.length === 0) return null;

  return (
    <div id="feature-matrix" ref={containerRef} className={cn(panelClass, "overflow-hidden mb-10 scroll-mt-28")}>
      <div className="p-6 md:p-8 border-b border-[#2a2a2a] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] text-[#fdfbf7]/50">
            <Table2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#fdfbf7] tracking-tight">Feature Matrix</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mt-1">Detailed Head-to-Head</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#fdfbf7]/30" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter criteria..."
            className="h-9 w-full rounded-sm border border-[#333] bg-[#0c0b0a] pl-9 pr-3 text-xs text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
          />
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto no-scrollbar relative">
        <div className="min-w-[700px]">
          {/* Sticky Header */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-[#0c0b0a] border-b border-[#2a2a2a] sticky top-0 z-30">
            <div className="p-6 font-bold uppercase tracking-widest text-[10px] text-[#fdfbf7]/40 self-end sticky left-0 z-40 bg-[#0c0b0a] border-r border-[#2a2a2a]">
              Criteria
            </div>
            <div className="p-6 border-l border-[#2a2a2a] bg-[#111]/50 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-50" style={{ color: result.entities.a.hex }}>Entity A</span>
              <span className="font-serif text-xl text-[#fdfbf7]">{result.entities.a.name}</span>
            </div>
            <div className="p-6 border-l border-[#2a2a2a] bg-[#111]/50 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-50" style={{ color: result.entities.b.hex }}>Entity B</span>
              <span className="font-serif text-xl text-[#fdfbf7]">{result.entities.b.name}</span>
            </div>
          </div>

          {/* Matrix Body */}
          {matrixData.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#fdfbf7]/40 font-serif italic">
              No criteria matching "{filter}"
            </div>
          ) : (
            matrixData.map((cat, i) => (
              <React.Fragment key={i}>
                <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] p-4 pl-6 flex items-center justify-between sticky top-[97px] z-20 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/80 sticky left-6 z-30">{cat.category}</span>
                  {cat.winner !== 'tie' && (
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-orange-400 border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 rounded-sm">
                      <Trophy className="h-3 w-3" />
                      Winner: {cat.winner === 'a' ? result.entities.a.name : result.entities.b.name}
                    </span>
                  )}
                </div>
                
                {cat.rows.map((row, j) => {
                  const isAWinner = cat.winner === 'a';
                  const isBWinner = cat.winner === 'b';

                  return (
                    <div key={j} className="matrix-row grid grid-cols-[1.2fr_1fr_1fr] border-b border-[#2a2a2a] hover:bg-[#151515] transition-colors group relative">
                      <div className="p-5 pl-6 text-sm text-[#fdfbf7]/90 font-medium sticky left-0 z-10 bg-[#0c0b0a] group-hover:bg-[#151515] border-r border-[#2a2a2a] transition-colors">
                        {row.label}
                      </div>
                      <div className={cn(
                        "p-5 border-l border-[#2a2a2a] text-sm text-[#fdfbf7]/60 group-hover:text-[#fdfbf7]/90 transition-colors leading-relaxed relative",
                        isAWinner && "bg-white/[0.02]"
                      )}>
                        {row.factA?.value || <span className="text-[#fdfbf7]/20 italic">Not specified</span>}
                      </div>
                      <div className={cn(
                        "p-5 border-l border-[#2a2a2a] text-sm text-[#fdfbf7]/60 group-hover:text-[#fdfbf7]/90 transition-colors leading-relaxed relative",
                        isBWinner && "bg-white/[0.02]"
                      )}>
                        {row.factB?.value || <span className="text-[#fdfbf7]/20 italic">Not specified</span>}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {matrixData.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#fdfbf7]/40 font-serif italic">
            No criteria matching "{filter}"
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {matrixData.map((cat, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/80">{cat.category}</span>
                  {cat.winner !== 'tie' && (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-orange-400 border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 rounded-sm">
                      <Trophy className="h-2.5 w-2.5" />
                      {cat.winner === 'a' ? result.entities.a.name : result.entities.b.name}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {cat.rows.map((row, j) => (
                    <div key={j} className="matrix-row rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                      <p className="text-xs font-bold text-[#fdfbf7]/70 mb-2">{row.label}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: result.entities.a.hex }}>{result.entities.a.name}</p>
                          <p className="text-xs text-[#fdfbf7]/60 leading-relaxed">{row.factA?.value || <span className="text-[#fdfbf7]/20 italic">Not specified</span>}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: result.entities.b.hex }}>{result.entities.b.name}</p>
                          <p className="text-xs text-[#fdfbf7]/60 leading-relaxed">{row.factB?.value || <span className="text-[#fdfbf7]/20 italic">Not specified</span>}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};