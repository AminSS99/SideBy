import React, { useRef } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { panelClass } from "./constants";

gsap.registerPlugin(ScrollTrigger);

export const SourcesPanel = ({ sources }: { sources: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.from(".sp-item", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 90%",
      },
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.7,
      ease: "back.out(1.2)"
    });
  }, { scope: containerRef });

  if (!sources || sources.length === 0) return null;

  return (
    <div ref={containerRef} className={`${panelClass} p-8`}>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-[#fdfbf7]/30" />
        <h3 className="font-serif text-2xl text-[#fdfbf7] tracking-tight">Sources Reviewed</h3>
      </div>
      
      <ul className="space-y-3">
        {sources.map((source: any, i: number) => {
          let domainName = source.domain;
          if (!domainName && source.url) {
            try {
              domainName = new URL(source.url).hostname.replace('www.', '');
            } catch (e) {
              domainName = 'Link';
            }
          }

          return (
            <li key={i} className="sp-item">
              <a 
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1.5 rounded-sm border border-[#2a2a2a] bg-[#111] p-4 transition-all hover:border-orange-500/40 hover:bg-[#1a110a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-serif text-[#fdfbf7] line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug">
                    {source.title || "Reference Link"}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-[#fdfbf7]/30 group-hover:text-orange-400 mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-1.5 py-0.5 bg-[#0c0b0a] border border-[#333] text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                    {source.reliability || 'Web'}
                  </span>
                  {domainName && (
                    <span className="text-[10px] text-[#fdfbf7]/30 uppercase tracking-widest truncate">
                      {domainName}
                    </span>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SourcesPanel;