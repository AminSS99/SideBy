import React from "react";
import { CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { ComparisonItem } from "@/data/mockDB";

interface WinConditionsProps {
  itemA: ComparisonItem;
  itemB: ComparisonItem;
}

const WinConditions = ({ itemA, itemB }: WinConditionsProps) => {
  const getWinMetric = (item: ComparisonItem, other: ComparisonItem) => {
    return Object.keys(item.metrics).find(m => item.metrics[m] > other.metrics[m] + 10);
  };

  const winA = getWinMetric(itemA, itemB);
  const winB = getWinMetric(itemB, itemA);

  const WinCard = ({ item, metric, color }: { item: ComparisonItem, metric?: string, color: string }) => (
    <div className={`flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
         <Zap className={`w-12 h-12 text-${color}-400`} />
      </div>
      <h5 className="text-[10px] font-black uppercase text-white/40 mb-3 tracking-widest">Killer Advantage</h5>
      {metric ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`w-5 h-5 text-${color}-400 mt-1`} />
          <div>
            <p className="text-sm font-black italic tracking-tight">{item.name} Dominates in {metric.toUpperCase()}</p>
            <p className="text-[10px] text-white/40 font-bold uppercase mt-1">Lead Margin: +{item.metrics[metric] - (item === itemA ? itemB.metrics[metric] : itemA.metrics[metric])}%</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 opacity-40">
          <AlertCircle className="w-5 h-5 text-white/40 mt-1" />
          <p className="text-sm font-black italic">Strategic Parity in key sectors.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-12">
      <WinCard item={itemA} metric={winA} color="blue" />
      <WinCard item={itemB} metric={winB} color="purple" />
    </div>
  );
};

export default WinConditions;