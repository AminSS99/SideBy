import React, { useRef } from 'react';
import { BookOpen, ExternalLink, Shield, FileText, Newspaper, Globe } from 'lucide-react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { panelClass } from "./constants";
import type { ComparisonSource } from "./types";

gsap.registerPlugin(ScrollTrigger);

const reliabilityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  official: { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Official" },
  docs: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Docs" },
  pricing: { icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Pricing" },
  statistics: { icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Stats" },
  review: { icon: Newspaper, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Review" },
  news: { icon: Newspaper, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "News" },
  encyclopedia: { icon: Globe, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", label: "Wiki" },
  database: { icon: Shield, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", label: "Database" },
};

function getReliabilityInfo(reliability?: string) {
  const key = (reliability || "review").toLowerCase();
  return reliabilityConfig[key] || reliabilityConfig.review;
}

function getDomain(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const SourcesPanel = ({ sources }: { sources: ComparisonSource[] }) => {
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
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
          {sources.length} source{sources.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ul className="space-y-3">
        {sources.map((source, i) => {
          const domain = getDomain(source.url);
          const rel = getReliabilityInfo(source.reliability);
          const RelIcon = rel.icon;

          return (
            <li key={i} className="sp-item">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2.5 rounded-sm border border-[#2a2a2a] bg-[#111] p-4 transition-all hover:border-orange-500/40 hover:bg-[#1a110a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-serif text-[#fdfbf7] line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug">
                    {source.title || "Reference Link"}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#fdfbf7]/30 group-hover:text-orange-400 mt-0.5 transition-colors" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[9px] font-bold uppercase tracking-widest ${rel.bg} ${rel.color}`}>
                    <RelIcon className="h-3 w-3" />
                    {rel.label}
                  </span>
                  {domain && (
                    <span className="text-[10px] text-[#fdfbf7]/30 uppercase tracking-widest truncate max-w-[150px]">
                      {domain}
                    </span>
                  )}
                  {source.confidence !== undefined && (
                    <span className="ml-auto text-[9px] text-[#fdfbf7]/30 uppercase tracking-widest">
                      {Math.round((source.confidence || 0) * 100)}% confidence
                    </span>
                  )}
                </div>

                {source.summary && (
                  <p className="text-[11px] text-[#fdfbf7]/40 line-clamp-2 leading-relaxed">
                    {source.summary}
                  </p>
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
