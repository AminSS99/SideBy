import React from "react";

interface ComparisonTableProps {
  itemA: any;
  itemB: any;
}

const ComparisonTable = ({ itemA, itemB }: ComparisonTableProps) => {
  const allSpecs = Array.from(new Set([
    ...Object.keys(itemA.specs),
    ...Object.keys(itemB.specs)
  ]));

  return (
    <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
      <div className="grid grid-cols-3 bg-white/5 p-4 border-b border-white/5">
        <div className="text-[10px] font-black uppercase text-white/20">Feature Analysis</div>
        <div className="text-center text-[10px] font-black uppercase text-blue-400">{itemA.name}</div>
        <div className="text-center text-[10px] font-black uppercase text-purple-400">{itemB.name}</div>
      </div>
      
      {allSpecs.map((spec) => (
        <div key={spec} className="grid grid-cols-3 p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
          <div className="text-xs font-bold text-white/40 uppercase tracking-tighter self-center">{spec}</div>
          <div className="text-center text-xs font-black self-center">{itemA.specs[spec] || "-"}</div>
          <div className="text-center text-xs font-black self-center">{itemB.specs[spec] || "-"}</div>
        </div>
      ))}
    </div>
  );
};

export default ComparisonTable;