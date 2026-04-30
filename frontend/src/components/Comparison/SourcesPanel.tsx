import React from "react";
import { panelClass } from "./constants";
import type { ComparisonSource } from "./types";

interface SourcesPanelProps {
  sources: ComparisonSource[];
}

export const SourcesPanel = ({ sources }: SourcesPanelProps) => (
  <div className={`${panelClass} p-8`}>
    <div className="mb-6 flex items-center justify-between">
      <h3 className="font-serif text-2xl text-[#fdfbf7] tracking-tight">Sources</h3>
      <span className="border border-[#333] bg-[#111] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
        Verified
      </span>
    </div>

    <div className="space-y-4">
      {sources.map((source) => (
        <a
          key={source.title}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group block border-b border-[#2a2a2a] pb-4 last:border-0 last:pb-0 transition-all hover:pl-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-medium text-[#fdfbf7]/80 group-hover:text-orange-400 transition-colors">
                {source.title}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {source.reliability}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                  {source.fetchedAt}
                </span>
              </div>
            </div>
            <svg className="h-4 w-4 flex-none text-[#fdfbf7]/20 group-hover:text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  </div>
);