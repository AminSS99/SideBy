import React, { useRef } from "react";
import { Activity, Cpu, Database, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors">
          <Activity className="h-5 w-5 text-orange-500" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Total AI Runs</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">139</p>
          <p className="mt-3 text-xs font-medium text-emerald-500">+24% from last week</p>
        </div>
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors">
          <Zap className="h-5 w-5 text-cyan-500" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Credits Used</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">425</p>
          <p className="mt-3 text-xs text-[#fdfbf7]/40">Out of 500 included</p>
        </div>
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors">
          <Cpu className="h-5 w-5 text-purple-500" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Tokens Generated</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">55.8k</p>
          <p className="mt-3 text-xs font-medium text-emerald-500">Highly efficient</p>
        </div>
        <div className="stat-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 hover:border-[#444] transition-colors">
          <Database className="h-5 w-5 text-emerald-500" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Indexed Docs</p>
          <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">12</p>
          <p className="mt-3 text-xs text-[#fdfbf7]/40">14.2 MB total storage</p>
        </div>
      </div>

      <div className="stat-chart rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-6 mb-8">
          <h2 className="font-serif text-2xl text-[#fdfbf7]">Activity Over Time</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 border border-[#333] px-3 py-1 rounded-sm bg-[#0c0b0a]">7 Days</span>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 12, fontFamily: "ui-sans-serif, system-ui, sans-serif" }} 
                axisLine={false} 
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 12, fontFamily: "ui-sans-serif, system-ui, sans-serif" }} 
                axisLine={false} 
                tickLine={false} 
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0c0b0a', borderColor: '#333', borderRadius: '4px', padding: '12px' }}
                itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Line 
                type="monotone" 
                dataKey="runs" 
                name="AI Runs"
                stroke="#ea580c" 
                strokeWidth={3}
                dot={{ fill: '#111', stroke: '#ea580c', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#ea580c', stroke: 'transparent' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;