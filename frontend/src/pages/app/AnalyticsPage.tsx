import React, { useRef } from "react";
import { Activity, Cpu, Database, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const mockData = [
  { date: "Mon", runs: 12, tokens: 4500 },
  { date: "Tue", runs: 19, tokens: 7200 },
  { date: "Wed", runs: 15, tokens: 5100 },
  { date: "Thu", runs: 28, tokens: 12400 },
  { date: "Fri", runs: 22, tokens: 8900 },
  { date: "Sat", runs: 8, tokens: 2100 },
  { date: "Sun", runs: 35, tokens: 15600 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-sm border border-[#333] bg-[#0c0b0a]/90 p-4 shadow-2xl backdrop-blur-xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">{label}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_#ea580c]" />
            <span className="text-sm font-medium text-[#fdfbf7]">{payload[0].value} runs</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".stat-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".stat-card", { y: 20, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".stat-chart", { y: 40, opacity: 0, duration: 1, ease: "expo.out" }, "-=0.4");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="stat-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Telemetry
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Usage Analytics
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          Monitor your workspace's AI consumption, active orchestration runs, and knowledge base indexing volume.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Activity className="h-5 w-5 text-orange-500 relative z-10" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 relative z-10">Total AI Runs</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7] relative z-10">139</p>
          <p className="mt-3 text-xs font-medium text-emerald-500 relative z-10">+24% from last week</p>
        </div>
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Zap className="h-5 w-5 text-cyan-500 relative z-10" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 relative z-10">Credits Used</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7] relative z-10">425</p>
          <p className="mt-3 text-xs text-[#fdfbf7]/40 relative z-10">Out of 500 included</p>
        </div>
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Cpu className="h-5 w-5 text-purple-500 relative z-10" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 relative z-10">Tokens Generated</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7] relative z-10">55.8k</p>
          <p className="mt-3 text-xs font-medium text-emerald-500 relative z-10">Highly efficient</p>
        </div>
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Database className="h-5 w-5 text-emerald-500 relative z-10" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 relative z-10">Indexed Docs</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7] relative z-10">12</p>
          <p className="mt-3 text-xs text-[#fdfbf7]/40 relative z-10">14.2 MB total storage</p>
        </div>
      </div>

      <div className="stat-chart rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-6 mb-8">
          <h2 className="font-serif text-2xl text-[#fdfbf7]">Activity Over Time</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 border border-[#333] px-3 py-1 rounded-sm bg-[#0c0b0a]">7 Days</span>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#555" 
                tick={{ fill: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
                axisLine={false} 
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#555" 
                tick={{ fill: '#888', fontSize: 12, fontFamily: "ui-sans-serif, system-ui, sans-serif" }} 
                axisLine={false} 
                tickLine={false} 
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#444', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="runs" 
                name="AI Runs"
                stroke="#ea580c" 
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRuns)"
                activeDot={{ r: 6, fill: '#ea580c', stroke: '#111', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;