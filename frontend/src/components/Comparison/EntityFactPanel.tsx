import React, { useRef, useMemo } from "react";
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

  const entityFactSummary = useMemo(() => {
    return (["a", "b"] as const).map((key) => {
      const entityFacts = facts[key] || [];
      return {
        key,
        entity: result.entities[key],
        totalCount: entityFacts.length,
        categories: entityFacts.slice(0, 6),
      };
    });
  }, [facts, result]);

  useGSAP(() => {
    if (!containerRef.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".efp-item", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          once: true,
        },
        y: 20,
        opacity: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm"
    >
      <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Fact Coverage</h3>
      <div className="space-y-4">
        {entityFactSummary.map(({ key, entity, totalCount, categories }) => (
          <div key={key} className="efp-item border border-[#2a2a2a] bg-[#111] p-5 rounded-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-serif" style={{ color: entity.hex }}>
                {entity.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 flex items-center gap-1">
                <span className="text-[#fdfbf7] text-xs">
                  {totalCount}
                </span>
                facts
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((f, idx) => (
                <span
                  key={`${key}-${f.category}-${idx}`}
                  className="border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 truncate max-w-[120px]"
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
