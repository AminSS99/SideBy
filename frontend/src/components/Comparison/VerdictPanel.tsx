import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { panelClass } from "./constants";
import type { ComparisonData } from "./types";
import { useT, type MessageKey } from "@/i18n";

gsap.registerPlugin(ScrollTrigger);

interface VerdictPanelProps {
  result: ComparisonData;
}

const GUIDE_KEYS: Record<string, MessageKey> = {
  "Daily Use": "res.guide.dailyUse", "Shared Use": "res.guide.sharedUse", "Budget Buyers": "res.guide.budget",
  "Power Users": "res.guide.powerUsers", "Support": "res.guide.support", "Work Setup": "res.guide.workSetup",
  "Relocation": "res.guide.relocation", "Students": "res.guide.students", "Long Stays": "res.guide.longStays",
  "Community": "res.guide.community", "Caveat": "res.guide.caveat", "Account Rules": "res.guide.accountRules",
  "Risk Fit": "res.guide.riskFit", "Tax Notes": "res.guide.taxNotes", "Official Rules": "res.guide.officialRules",
  "Training Goal": "res.guide.trainingGoal", "Beginner Fit": "res.guide.beginnerFit", "Advanced Use": "res.guide.advancedUse",
  "Safety": "res.guide.safety", "Skill Fit": "res.guide.skillFit", "Employer Signal": "res.guide.employerSignal",
  "Learners": "res.guide.learners", "Long-Term Path": "res.guide.longTerm", "Market Demand": "res.guide.marketDemand",
  "Entry Path": "res.guide.entryPath", "Developers": "res.guide.developers", "Teams": "res.guide.teams",
  "Ecosystem": "res.guide.ecosystem",
};

export const VerdictPanel = ({ result }: VerdictPanelProps) => {
  const t = useT();
  const guideLabel = (label: string) => (GUIDE_KEYS[label] ? t(GUIDE_KEYS[label]) : label);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    { label: t("res.guide.overall"), value: result.verdict.bestOverall, key: "bestOverall", highlight: true },
    { label: t("res.guide.value"), value: result.verdict.bestValue, key: "bestValue" },
    { label: guideLabel(categoryLabels.developers || "Developers"), value: result.verdict.developers, key: "developers" },
    { label: guideLabel(categoryLabels.teams || "Teams"), value: result.verdict.teams, key: "teams" },
    { label: guideLabel(categoryLabels.students || "Students"), value: result.verdict.students, key: "students" },
    { label: guideLabel(categoryLabels.powerUsers || "Power Users"), value: result.verdict.powerUsers, key: "powerUsers" },
    { label: guideLabel(categoryLabels.ecosystem || "Ecosystem"), value: result.verdict.ecosystem || t("res.guide.dependsStack"), key: "ecosystem" },
  ];

  return (
    <div ref={containerRef} className={`${panelClass} relative overflow-hidden p-5 sm:p-7`}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/[0.08] blur-3xl" />
      <div className="relative mb-5 flex items-center justify-between gap-3">
        <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300">{t("res.guide.kicker")}</p><h3 className="mt-1 font-serif text-2xl tracking-tight text-[#fffaf1]">{t("res.guide.title")}</h3></div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[9px] font-semibold text-white/45">{t("res.guide.scenarios", { count: rows.length })}</span>
      </div>
      <div className="relative space-y-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`vp-row flex min-h-12 flex-col items-start justify-between gap-1 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.035] sm:flex-row sm:items-center sm:gap-4 ${row.highlight ? 'vp-overall border border-orange-300/15 bg-gradient-to-r from-orange-500/[0.12] to-rose-500/[0.05]' : ''}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${row.highlight ? 'text-orange-500' : 'text-[#fdfbf7]/40'}`}>
              {row.label}
            </span>
            <span className={`text-sm font-semibold leading-5 sm:max-w-[60%] sm:text-right ${row.highlight ? 'text-orange-300' : 'text-[#fdfbf7]/85'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
