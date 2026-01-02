import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

const MarketForecast = ({ category, itemA, itemB }: { category: string, itemA: any, itemB: any }) => {
  const data = [
    { name: "Month 1", A: 85, B: 70 },
    { name: "Month 2", A: 88, B: 75 },
    { name: "Month 3", A: 82, B: 85 },
    { name: "Month 4", A: 90, B: 82 },
    { name: "Month 5", A: 95, B: 80 },
    { name: "Month 6", A: 92, B: 88 },
  ];

  const label = category === "tech" ? "Value Retention" : "Seasonal Demand";

  return (
    <div className="bg-white/5 rounded-3xl border border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-400" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">{label} Forecast</h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[9px] font-bold text-white/40">{itemA.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-white/40">{itemB.name}</span>
          </div>
        </div>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="A" stroke="#a855f7" fillOpacity={1} fill="url(#colorA)" />
            <Area type="monotone" dataKey="B" stroke="#10b981" fillOpacity={1} fill="url(#colorB)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span className="text-[10px] font-black tracking-tighter uppercase italic">Neutral Growth Projected</span>
        </div>
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Data Sync: T-0m 12s</span>
      </div>
    </div>
  );
};

export default MarketForecast;