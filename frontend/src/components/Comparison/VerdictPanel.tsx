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
    gsap.from(".vp-row", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 90%",
      },
      x: -20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  const rows = [
    { label: "Best Overall", value: result.verdict.bestOverall, key: "bestOverall" },
    { label: "Best Value", value: result.verdict.bestValue, key: "bestValue" },
    { label: "Developers", value: result.verdict.developers, key: "developers" },
    { label: "Teams", value: result.verdict.teams, key: "teams" },
    { label: "Students", value: result.verdict.students, key: "students" },
    { label: "Power Users", value: result.verdict.powerUsers, key: "powerUsers" },
    { label: "Ecosystem", value: result.verdict.ecosystem || "Depends on stack", key: "ecosystem" },
  ];

  return (
    <div ref={containerRef} className={`${panelClass} p-8`}>
      <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Decision Matrix</h3>
      <div className="divide-y divide-[#2a2a2a] border-y border-[#2a2a2a] overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.key}
            className="vp-row flex items-center justify-between py-3.5"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
              {row.label}
            </span>
            <span className="text-sm font-medium text-[#fdfbf7]/90">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};