import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

export const SourcesPanel = ({ sources }: { sources: any[] }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="rounded-3xl border border-[#2a2a2a] bg-[#111]/50 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-orange-500" />
        <h3 className="font-serif text-lg text-[#fdfbf7]">Sources Reviewed</h3>
      </div>
      
      <ul className="space-y-3">
        {sources.map((source: any, i: number) => {
          // Attempt to extract domain if not explicitly provided
          let domainName = source.domain;
          if (!domainName && source.url) {
            try {
              domainName = new URL(source.url).hostname.replace('www.', '');
            } catch (e) {
              domainName = 'Link';
            }
          }

          return (
            <li key={i}>
              <a 
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 rounded-xl border border-[#2a2a2a] bg-[#0c0b0a] p-3 transition-all hover:border-orange-500/30 hover:bg-[#1a1a1a]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#fdfbf7] line-clamp-1 group-hover:text-orange-400 transition-colors">
                    {source.title || "Reference Link"}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-[#fdfbf7]/30 group-hover:text-orange-400" />
                </div>
                {domainName && (
                  <span className="text-[10px] text-[#fdfbf7]/40 uppercase tracking-wider">
                    {domainName}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SourcesPanel;