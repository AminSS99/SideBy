import React, { useRef } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ComparisonData } from './types';
import { panelClass } from './constants';

gsap.registerPlugin(ScrollTrigger);

export const ConsensusPanel = ({ result }: { result: ComparisonData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    gsap.from(".cons-box", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
      },
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  if (!result.consensus || !result.contradictions) return null;

  return (
    <div ref={containerRef} className="grid md:grid-cols-2 gap-6 mb-10">
      {/* Consensus Box */}
      <div className={`cons-box ${panelClass} p-8 border-t-2 border-t-emerald-500 bg-[#0a100d] transition-colors hover:border-emerald-500/50`}>
        <div className="flex items-center gap-3 mb-6 border-b border-[#2a2a2a] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#fdfbf7]">Consensus</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Where sources agree</p>
          </div>
        </div>
        <ul className="space-y-4">
          {result.consensus.map((text, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70 leading-relaxed">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 opacity-60" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Contradictions Box */}
      <div className={`cons-box ${panelClass} p-8 border-t-2 border-t-amber-500 bg-[#120f0a] transition-colors hover:border-amber-500/50`}>
        <div className="flex items-center gap-3 mb-6 border-b border-[#2a2a2a] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#fdfbf7]">Contradictions</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">Conflicting signals</p>
          </div>
        </div>
        <ul className="space-y-4">
          {result.contradictions.map((text, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70 leading-relaxed">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 opacity-60" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};