import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';
import { panelClass } from './constants';
import type { ComparisonData } from './types';

export const TableOfContents = ({ result }: { result: ComparisonData }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Scroll spy to highlight the active section in the TOC
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    result.categories.forEach((_, i) => {
      const el = document.getElementById(`category-${i}`);
      if (el) observer.observe(el);
    });

    [
      'executive-brief',
      'personalized-verdict',
      'changed-facts',
      'confidence-heatmap',
      'evidence-graph',
      'research-replay',
      'source-quality',
      'decision-board',
      'feature-matrix',
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [result.categories]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn(panelClass, "p-6 mb-6 hidden md:block")}>
      <div className="flex items-center gap-2 mb-4 text-[#fdfbf7]/50">
        <List className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Contents</span>
      </div>
      <div className="space-y-1 border-l border-[#333] ml-2 pl-4">
        {[
          ['executive-brief', 'Executive Brief'],
          ['personalized-verdict', 'Weighted Verdict'],
          ['changed-facts', 'Changed Facts'],
          ['confidence-heatmap', 'Confidence'],
          ['evidence-graph', 'Evidence Graph'],
          ['research-replay', 'Research Replay'],
          ['source-quality', 'Source Modes'],
          ['decision-board', 'Decision Board'],
          ['feature-matrix', 'Feature Matrix'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={cn(
              "block text-left text-xs transition-colors hover:text-orange-400 py-1.5",
              activeId === id ? "text-orange-400 font-bold" : "text-[#fdfbf7]/60"
            )}
          >
            {label}
          </button>
        ))}
        {result.categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => scrollTo(`category-${i}`)}
            className={cn(
              "block text-left text-xs transition-colors hover:text-orange-400 py-1.5",
              activeId === `category-${i}` ? "text-orange-400 font-bold" : "text-[#fdfbf7]/60"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};
