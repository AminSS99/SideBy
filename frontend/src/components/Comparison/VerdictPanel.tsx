import React from "react";
import { panelClass } from "./constants";
import type { ComparisonData } from "./types";

interface VerdictPanelProps {
  result: ComparisonData;
}

export const VerdictPanel = ({ result }: VerdictPanelProps) => {
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
    <div className={`${panelClass} p-8`}>
      <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Decision Matrix</h3>
      <div className="divide-y divide-[#2a2a2a] border-y border-[#2a2a2a]">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between py-3.5"
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