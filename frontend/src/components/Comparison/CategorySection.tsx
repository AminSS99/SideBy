import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { colors } from "@/config/brand";
import { FactCard } from "./FactCard";
import type { Category, ComparisonData } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface CategorySectionProps {
  category: Category;
  entities: ComparisonData["entities"];
  index: number;
}

export const CategorySection = ({
  category,
  entities,
  index,
}: CategorySectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%", // Triggers when top of element hits 85% down the viewport
        toggleActions: "play none none none",
      },
    });

    // Top border animation
    tl.from(".cs-border", {
      scaleX: 0,
      transformOrigin: "left",
      duration: 0.8,
      ease: "power3.inOut",
    });

    // Text content animation
    tl.from(".cs-text", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
    }, "-=0.4");

    // Fact cards staggered entrance
    tl.from(".cs-fact", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.2)",
    }, "-=0.6");
    
    // Animate confidence bars inside fact cards
    tl.from(".cs-fact .confidence-bar", {
      scaleX: 0,
      transformOrigin: "left",
      duration: 1,
      stagger: 0.1,
      ease: "power3.out"
    }, "-=0.6");

  }, { scope: containerRef });

  const winnerEntity =
    category.winner === "tie" ? null : entities[category.winner];
  const winnerColor =
    category.winner === "a"
      ? colors.entityA
      : category.winner === "b"
        ? colors.entityB
        : null;

  return (
    <article ref={containerRef} className="relative pt-12">
      {/* Animated Top Border */}
      <div className="cs-border absolute top-0 left-0 right-0 h-[1px] bg-[#2a2a2a]" />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between overflow-hidden">
        <div>
          <h3 className="cs-text font-serif text-3xl text-[#fdfbf7] tracking-tight">{category.name}</h3>
          <p className="cs-text mt-3 max-w-2xl text-base leading-relaxed text-[#fdfbf7]/70 font-serif">
            {category.verdict}
          </p>
        </div>
        {winnerEntity && (
          <div className="cs-text">
            <span
              className="flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-1 text-[11px] font-bold uppercase tracking-widest"
              style={{
                borderColor: winnerColor || '#fff',
                color: winnerColor || '#fff',
              }}
            >
              <CrownIcon className="h-3 w-3" />
              {winnerEntity.name} leads
            </span>
          </div>
        )}
        {category.winner === "tie" && (
          <div className="cs-text">
            <span className="flex items-center gap-2 whitespace-nowrap border-b-2 border-[#555] px-1 py-1 text-[11px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
              <span className="text-sm font-serif">⚖</span>
              Tied
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {category.facts.map((fact) => (
          <FactCard
            key={`${fact.entity}-${fact.label}`}
            fact={fact}
            entity={entities[fact.entity]}
            className="cs-fact"
          />
        ))}
      </div>
    </article>
  );
};

const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zM3 20h18" />
  </svg>
);