import React from 'react';
import { Check, X, Trophy } from 'lucide-react';

export const CategorySection = ({ category, entities, index }: { category: any, entities: string[], index: number }) => {
  if (!category) return null;

  return (
    <div className="rounded-3xl border border-[#2a2a2a] bg-[#111]/50 p-6 backdrop-blur-md sm:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2a2a2a] pb-6">
        <h3 className="font-serif text-2xl text-[#fdfbf7] flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-sm font-bold text-orange-500">
            {index + 1}
          </span>
          {category.name}
        </h3>
        {category.winner && (
          <div className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400">
            <Trophy className="h-4 w-4" />
            Winner: {category.winner}
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {entities.map((entity: string) => {
          const data = category.entities?.[entity];
          // If there's no data for this specific entity in this category, we skip rendering details
          if (!data) return null;

          return (
            <div key={entity} className="space-y-4">
              <h4 className="font-serif text-xl text-[#fdfbf7]">{entity}</h4>
              
              {data.summary && (
                <p className="text-sm leading-relaxed text-[#fdfbf7]/70">
                  {data.summary}
                </p>
              )}
              
              <div className="space-y-4 pt-4">
                {data.pro && data.pro.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Pros</span>
                    <ul className="space-y-2">
                      {data.pro.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-[#fdfbf7]/80">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.con && data.con.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Cons</span>
                    <ul className="space-y-2">
                      {data.con.map((con: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-[#fdfbf7]/80">
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {category.justification && (
        <div className="mt-8 rounded-2xl bg-[#0c0b0a] p-5 border border-[#2a2a2a]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 block mb-2">Takeaway</span>
          <p className="text-sm text-[#fdfbf7]/80 italic">"{category.justification}"</p>
        </div>
      )}
    </div>
  );
};

export default CategorySection;