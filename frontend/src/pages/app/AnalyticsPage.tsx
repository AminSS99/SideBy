import React from "react";
import { Activity, Cpu, Database, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { date: "Mon", runs: 12, tokens: 4500 },
  { date: "Tue", runs: 19, tokens: 7200 },
  { date: "Wed", runs: 15, tokens: 5100 },
  { date: "Thu", runs: 28, tokens: 12400 },
  { date: "Fri", runs: 22, tokens: 8900 },
  { date: "Sat", runs: 8, tokens: 2100 },
  { date: "Sun", runs: 35, tokens: 15600 },
];

const AnalyticsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          Telemetry
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Usage Analytics
        </h1>
        <p className="mt-4 max-w-3xl text-white/60">
          Monitor your workspace's AI consumption, active orchestration runs, and knowledge base indexing volume.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
          <Activity className="h-5 w-5 text-orange-400" />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Total AI Runs</p>
          <p className="mt-2 text-3xl font-black text-white">139</p>
          <p className="mt-2 text-xs text-emerald-400">+24% from last week</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
          <Zap className="h-5 w-5 text-cyan-400" />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Credits Used</p>
          <p className="mt-2 text-3xl font-black text-white">425</p>
          <p className="mt-2 text-xs text-white/40">Out of 500 included</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
          <Cpu className="h-5 w-5 text-purple-400" />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Tokens Generated</p>
          <p className="mt-2 text-3xl font-black text-white">55.8k</p>
          <p className="mt-2 text-xs text-emerald-400">Highly efficient</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
          <Database className="h-5 w-5 text-emerald-400" />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Indexed Docs</p>
          <p className="mt-2 text-3xl font-black text-white">12</p>
          <p className="mt-2 text-xs text-white/40">14.2 MB total storage</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-8">
        <h2 className="text-xl font-bold text-white mb-8">Activity Over Time (7 Days)</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.3)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="runs" 
                name="AI Runs"
                stroke="#ea580c" 
                strokeWidth={3}
                dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#fff' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;