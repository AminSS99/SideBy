import React, { useRef } from 'react';
import { Activity, Cpu, CircleDollarSign, Zap } from 'lucide-react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ComparisonData } from './types';
import { panelClass } from './constants';

gsap.registerPlugin(ScrollTrigger);

export const RunTelemetryPanel = ({ result }: { result: ComparisonData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    gsap.from(".telemetry-item", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 95%",
      },
      x: -20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  if (!result.telemetry) return null;
  const { latencyMs, inputTokens, outputTokens, estimatedCost, models } = result.telemetry;

  return (
    <div ref={containerRef} className={`${panelClass} p-6`}>
      <div className="flex items-center gap-2 mb-5 text-[#fdfbf7]/50 border-b border-[#2a2a2a] pb-4">
        <Activity className="h-4 w-4 text-cyan-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]">Run Telemetry</span>
      </div>

      <div className="space-y-4">
        <div className="telemetry-item flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#fdfbf7]/60">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-xs">Execution Time</span>
          </div>
          <span className="font-mono text-xs text-[#fdfbf7]">{(latencyMs / 1000).toFixed(2)}s</span>
        </div>

        <div className="telemetry-item flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#fdfbf7]/60">
            <Cpu className="h-3.5 w-3.5" />
            <span className="text-xs">Tokens (In / Out)</span>
          </div>
          <span className="font-mono text-xs text-[#fdfbf7]">
            {(inputTokens / 1000).toFixed(1)}k / {(outputTokens / 1000).toFixed(1)}k
          </span>
        </div>

        <div className="telemetry-item flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#fdfbf7]/60">
            <CircleDollarSign className="h-3.5 w-3.5" />
            <span className="text-xs">Estimated Cost</span>
          </div>
          <span className="font-mono text-xs text-orange-400">${estimatedCost.toFixed(3)}</span>
        </div>
      </div>

      {models && models.length > 0 && (
        <div className="telemetry-item mt-5 pt-4 border-t border-[#2a2a2a]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-2">Models Orchestrated</p>
          <div className="flex flex-wrap gap-2">
            {models.map(m => (
              <span key={m} className="px-2 py-1 rounded bg-[#1a1a1a] border border-[#333] text-[10px] font-mono text-[#fdfbf7]/70">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RunTelemetryPanel;