import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ComparisonData } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface EntityFactPanelProps {
  result: ComparisonData;
  facts: Record<string, Array<{ category: string }>>;
}

export const EntityFactPanel = ({ result, facts }: EntityFactPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    gsap.from(".efp-item", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 90%",
      },
      y: 20,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="border border-[#2a2a2a] bg-[#0c0b0a] p-8"
    >
      <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Fact Coverage</h3>
      <div className="space-y-4">
        {(["a", "b"] as const).map((key) => (
          <div key={key} className="efp-item border border-[#2a2a2a] bg-[#111] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-serif" style={{ color: result.entities[key].hex }}>
                {result.entities[key].name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                {facts[key].length} facts
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {facts[key].slice(0, 4).map((f) => (
                <span
                  key={`${key}-${f.category}`}
                  className="border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50"
                >
                  {f.category}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};