import React from 'react';
import { Trophy } from 'lucide-react';
import { FactCard } from './FactCard';
import type { Category, Entity } from './types';

interface CategorySectionProps {
  category: Category;
  entities: { a: Entity; b: Entity };
  index: number;
}

export const CategorySection = ({ category, entities, index }: CategorySectionProps) => {
  if (!category) return null;

  const winnerEntity = category.winner === 'a' ? entities.a 
                     : category.winner === 'b' ? entities.b 
                     : null;

  return (
    <div className="rounded-3xl border border-[#2a2a2a] bg-[#111]/50 p-6 backdrop-blur-md sm:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2a2a2a] pb-6">
        <h3 className="font-serif text-2xl text-[#fdfbf7] flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-sm font-bold text-orange-500">
            {index + 1}
          </span>
          {category.name}
        </h3>
        
        {category.winner !== 'tie' && winnerEntity && (
          <div className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400">
            <Trophy className="h-4 w-4" />
            Winner: {winnerEntity.name}
          </div>
        )}
        
        {category.winner === 'tie' && (
          <div className="flex items-center gap-2 rounded-full border border-[#444] bg-[#222] px-4 py-1.5 text-sm font-medium text-[#fdfbf7]/60">
            Tie
          </div>
        )}
      </div>

      {/* Category Takeaway / Verdict */}
      {category.verdict && (
        <div className="mb-8 rounded-2xl bg-[#0c0b0a] p-5 border border-[#2a2a2a]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-2">Takeaway</span>
          <p className="text-sm text-[#fdfbf7]/80 italic font-serif leading-relaxed">"{category.verdict}"</p>
        </div>
      )}

      {/* Side-by-side facts */}
      <div className="grid gap-6 md:grid-cols-2">
        {(["a", "b"] as const).map((key) => {
          const entity = entities[key];
          const entityFacts = category.facts?.filter((f) => f.entity === key) || [];

          if (entityFacts.length === 0) return null;

          return (
            <div key={key} className="space-y-4">
              {entityFacts.map((fact, i) => (
                <FactCard key={i} fact={fact} entity={entity} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySection;