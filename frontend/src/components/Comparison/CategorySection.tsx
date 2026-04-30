import React from "react";
import { motion } from "framer-motion";
import { colors } from "@/config/brand";
import { stagger } from "./constants";
import { FactCard } from "./FactCard";
import type { Category, ComparisonData } from "./types";

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
  const winnerEntity =
    category.winner === "tie" ? null : entities[category.winner];
  const winnerColor =
    category.winner === "a"
      ? colors.entityA
      : category.winner === "b"
        ? colors.entityB
        : null;

  return (
    <motion.article
      {...stagger(index)}
      className="border-t border-[#2a2a2a] pt-12"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-3xl text-[#fdfbf7] tracking-tight">{category.name}</h3>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#fdfbf7]/70 font-serif">
            {category.verdict}
          </p>
        </div>
        {winnerEntity && (
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
        )}
        {category.winner === "tie" && (
          <span className="flex items-center gap-2 whitespace-nowrap border-b-2 border-[#555] px-1 py-1 text-[11px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
            <span className="text-sm font-serif">⚖</span>
            Tied
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {category.facts.map((fact) => (
          <FactCard
            key={`${fact.entity}-${fact.label}`}
            fact={fact}
            entity={entities[fact.entity]}
          />
        ))}
      </div>
    </motion.article>
  );
};

const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zM3 20h18" />
  </svg>
);