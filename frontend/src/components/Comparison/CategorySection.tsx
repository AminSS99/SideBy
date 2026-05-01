import React, { useRef } from 'react';
import { Trophy } from 'lucide-react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FactCard } from './FactCard';
import type { Category, Entity } from './types';

gsap.registerPlugin(ScrollTrigger);

interface CategorySectionProps {
  category: Category;
  entities: { a: Entity; b: Entity };
  index: number;
}

export const CategorySection = ({ category, entities, index }: CategorySectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // The entire category block slides up and fades in
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 85%", // Trigger when top of element hits 85% down the viewport
        toggleActions: "play none none reverse",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "expo.out",
    });

    // Animate the header elements
    gsap.from(el.querySelectorAll('.cat-header-item'), {
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
      },
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out"
    });

    // Takeaway block sweep in
    if (el.querySelector('.cat-takeaway')) {
      gsap.from(el.querySelector('.cat-takeaway'), {
        scrollTrigger: {
          trigger: el.querySelector('.cat-takeaway'),
          start: "top 90%",
        },
        x: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    }

  }, { scope: containerRef });

  if (!category) return null;

  const winnerEntity = category.winner === 'a' ? entities.a 
                     : category.winner === 'b' ? entities.b 
                     : null;

  return (
    <div id={`category-${index}`} ref={containerRef} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-8 sm:p-10 relative overflow-hidden break-inside-avoid scroll-mt-28">
      {/* Subtle background number watermark */}
      <div className="absolute -right-8 -top-12 z-0 font-serif text-[200px] font-black italic leading-none text-[#ffffff03] select-none pointer-events-none">
        {index + 1}
      </div>

      <div className="relative z-10 mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#2a2a2a] pb-8">
        <h3 className="cat-header-item font-serif text-3xl text-[#fdfbf7] flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] text-sm font-bold text-[#fdfbf7]/50 font-sans">
            0{index + 1}
          </span>
          {category.name}
        </h3>
        
        {category.winner !== 'tie' && winnerEntity && (
          <div className="cat-header-item flex items-center gap-2 rounded-sm border border-orange-500/30 bg-[#1a110a] px-5 py-2 text-sm font-bold uppercase tracking-widest text-orange-500">
            <Trophy className="h-4 w-4" />
            Winner: {winnerEntity.name}
          </div>
        )}
        
        {category.winner === 'tie' && (
          <div className="cat-header-item flex items-center gap-2 rounded-sm border border-[#444] bg-[#1a1a1a] px-5 py-2 text-sm font-bold uppercase tracking-widest text-[#fdfbf7]/60">
            Tie
          </div>
        )}
      </div>

      {category.verdict && (
        <div className="cat-takeaway mb-10 rounded-sm bg-[#111] p-6 border-l-2 border-orange-500 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-3">Key Takeaway</span>
          <p className="text-lg text-[#fdfbf7]/90 italic font-serif leading-relaxed">"{category.verdict}"</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 relative z-10">
        {(["a", "b"] as const).map((key) => {
          const entity = entities[key];
          const entityFacts = category.facts?.filter((f) => f.entity === key) || [];

          if (entityFacts.length === 0) return null;

          return (
            <div key={key} className="space-y-6">
              {entityFacts.map((fact, i) => (
                <FactCard key={i} fact={fact} entity={entity} index={i} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySection;