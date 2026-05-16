import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { panelClass } from "./constants";
import type { ComparisonData } from "./types";

gsap.registerPlugin(ScrollTrigger);

interface VerdictPanelProps {
  result: ComparisonData;
}

export const VerdictPanel = ({ result }: VerdictPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.from(".vp-row", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
      },
      x: -30,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: "power3.out"
    });
    
    // Highlight the "Best Overall" row specifically
    gsap.from(".vp-overall", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      },
      backgroundColor: "rgba(234,88,12,0)",
      duration: 1,
      delay: 0.5,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  const labelsByCategory: Record<string, Record<string, string>> = {
    product: {
      developers: "Daily Use",
      teams: "Shared Use",
      students: "Budget Buyers",
      powerUsers: "Power Users",
      ecosystem: "Support",
    },
    place: {
      developers: "Work Setup",
      teams: "Relocation",
      students: "Students",
      powerUsers: "Long Stays",
      ecosystem: "Community",
    },
    finance_info: {
      developers: "Caveat",
      teams: "Account Rules",
      students: "Risk Fit",
      powerUsers: "Tax Notes",
      ecosystem: "Official Rules",
    },
    health_fitness: {
      developers: "Training Goal",
      teams: "Support",
      students: "Beginner Fit",
      powerUsers: "Advanced Use",
      ecosystem: "Safety",
    },
    education: {
      developers: "Skill Fit",
      teams: "Employer Signal",
      students: "Learners",
      powerUsers: "Long-Term Path",
      ecosystem: "Market Demand",
    },
    career: {
      developers: "Skill Fit",
      teams: "Employer Signal",
      students: "Entry Path",
      powerUsers: "Long-Term Path",
      ecosystem: "Market Demand",
    },
  };
  const categoryLabels = labelsByCategory[result.taxonomy?.category || ""] || {};
  const rows = [
    { label: "Best Overall", value: result.verdict.bestOverall, key: "bestOverall", highlight: true },
    { label: "Best Value", value: result.verdict.bestValue, key: "bestValue" },
    { label: categoryLabels.developers || "Developers", value: result.verdict.developers, key: "developers" },
    { label: categoryLabels.teams || "Teams", value: result.verdict.teams, key: "teams" },
    { label: categoryLabels.students || "Students", value: result.verdict.students, key: "students" },
    { label: categoryLabels.powerUsers || "Power Users", value: result.verdict.powerUsers, key: "powerUsers" },
    { label: categoryLabels.ecosystem || "Ecosystem", value: result.verdict.ecosystem || "Depends on stack", key: "ecosystem" },
  ];

  return (
    <div ref={containerRef} className={`${panelClass} p-8 relative overflow-hidden`}>
      <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Decision Matrix</h3>
      <div className="divide-y divide-[#2a2a2a] border-t border-[#2a2a2a]">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`vp-row flex items-center justify-between py-4 px-2 -mx-2 rounded-sm transition-colors hover:bg-[#111] ${row.highlight ? 'vp-overall bg-[#1a110a] border-l-2 border-orange-500' : ''}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${row.highlight ? 'text-orange-500' : 'text-[#fdfbf7]/40'}`}>
              {row.label}
            </span>
            <span className={`text-sm font-medium ${row.highlight ? 'text-orange-400 font-bold' : 'text-[#fdfbf7]/90'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
