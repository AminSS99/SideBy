import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ComparisonItem } from "@/data/mockDB";

interface ComparisonRadarProps {
  itemA: ComparisonItem;
  itemB: ComparisonItem;
}

const ComparisonRadar = ({ itemA, itemB }: ComparisonRadarProps) => {
  const metrics = Object.keys(itemA.metrics);
  const data = metrics.map((m) => ({
    subject: m.toUpperCase(),
    A: itemA.metrics[m],
    B: itemB.metrics[m],
    fullMark: 100,
  }));

  return (
    <div className="h-[350px] w-full bg-white/5 rounded-3xl border border-white/5 p-6 animate-in fade-in zoom-in duration-1000">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-center mb-4 text-white/30">Neural Blueprint</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#ffffff10" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 'bold' }} 
          />
          <Radar
            name={itemA.name}
            dataKey="A"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.4}
          />
          <Radar
            name={itemB.name}
            dataKey="B"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.4}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonRadar;