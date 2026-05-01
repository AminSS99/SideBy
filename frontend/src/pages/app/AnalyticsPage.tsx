import React, { useState, useRef } from "react";
import { Activity, Cpu, Database, Zap, DollarSign, ActivitySquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GlowCard } from "@/components/GlowCard";

type Tab = "overview" | "costs" | "health";

const usageData = [
  { date: "Mon", runs: 12, tokens: 4500 },
  { date: "Tue", runs: 19, tokens: 7200 },
  { date: "Wed", runs: 15, tokens: 5100 },
  { date: "Thu", runs: 28, tokens: 12400 },
  { date: "Fri", runs: 22, tokens: 8900 },
  { date: "Sat", runs: 8, tokens: 2100 },
  { date: "Sun", runs: 35, tokens: 15600 },
];

const costData = [
  { name: "DeepSeek V3", cost: 1.45, color: "#3b82f6" }, // blue-500
  { name: "Gemini 2.0 Flash", cost: 0.85, color: "#a855f7" }, // purple-500
  { name: "Claude 3.5 Sonnet", cost: 3.20, color: "#f97316" }, // orange-500
  { name: "GPT-4o Mini", cost: 0.40, color: "#10b981" }, // emerald-500
];

const healthData = [
  { provider: "DeepSeek V3", status: "operational", latency: "850ms", uptime: "99.98%", errors: "0.02%", routing: "Primary Extraction" },
  { provider: "Gemini 2.0 Flash", status: "operational", latency: "1.2s", uptime: "99.99%", errors: "0.01%", routing: "Primary Synthesis" },
  { provider: "Claude 3.5 Sonnet", status: "degraded", latency: "3.4s", uptime: "98.50%", errors: "1.50%", routing: "Fallback Synthesis" },
  { provider: "GPT-4o Mini", status: "operational", latency: "650ms", uptime: "99.99%", errors: "0.05%", routing: "Classification" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-sm border border-[#333] bg-[#0c0b0a]/90 p-4 shadow-2xl backdrop-blur-xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">{label}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" 
              style={{ backgroundColor: payload[0].color || payload[0].payload.color || '#ea580c', color: payload[0].color || payload[0].payload.color || '#ea580c' }} 
            />
            <span className="text-sm font-medium text-[#fdfbf7]">
              {payload[0].name === "Cost" ? "$" : ""}{payload[0].value} {payload[0].name !== "Cost" ? payload[0].name : ""}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".stat-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".stat-nav", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.6")
      .from(".stat-content", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="stat-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Telemetry
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Platform Analytics
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          Monitor your workspace's AI consumption, inspect orchestration costs, and track the health of underlying LLM providers.
        </p>
      </div>

      <div className="stat-nav flex items-center gap-2 border-b border-[#2a2a2a] pb-px overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
            activeTab === "overview" ? "text-orange-400" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
          }`}
        >
          <Activity className="h-4 w-4" />
          Usage Overview
          {activeTab === "overview" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("costs")}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
            activeTab === "costs" ? "text-orange-400" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Cost Inspector
          {activeTab === "costs" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
            activeTab === "health" ? "text-orange-400" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
          }`}
        >
          <ActivitySquare className="h-4 w-4" />
          Provider Health
          {activeTab === "health" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500" />
          )}
        </button>
      </div>

      <div className="stat-content">
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <GlowCard className="p-8">
                <Activity className="h-5 w-5 text-orange-500" />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Total AI Runs</p>
                <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">139</p>
                <p className="mt-3 text-xs font-medium text-emerald-500">+24% from last week</p>
              </GlowCard>
              <GlowCard className="p-8" glowColor="rgba(8, 145, 178, 0.15)">
                <Zap className="h-5 w-5 text-cyan-500" />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Credits Used</p>
                <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">425</p>
                <p className="mt-3 text-xs text-[#fdfbf7]/40">Out of 500 included</p>
              </GlowCard>
              <GlowCard className="p-8" glowColor="rgba(168, 85, 247, 0.15)">
                <Cpu className="h-5 w-5 text-purple-500" />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Tokens Generated</p>
                <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">55.8k</p>
                <p className="mt-3 text-xs font-medium text-emerald-500">Highly efficient</p>
              </GlowCard>
              <GlowCard className="p-8" glowColor="rgba(16, 185, 129, 0.15)">
                <Database className="h-5 w-5 text-emerald-500" />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Indexed Docs</p>
                <p className="mt-2 font-serif text-4xl text-[#fdfbf7]">12</p>
                <p className="mt-3 text-xs text-[#fdfbf7]/40">14.2 MB total storage</p>
              </GlowCard>
            </div>

            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-6 mb-8">
                <h2 className="font-serif text-2xl text-[#fdfbf7]">Activity Over Time</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 border border-[#333] px-3 py-1 rounded-sm bg-[#0c0b0a]">7 Days</span>
              </div>
              
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
        )}

        {activeTab === "costs" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-6 md:grid-cols-3">
              <GlowCard className="p-8" glowColor="rgba(234, 88, 12, 0.15)">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-4">Total Orchestration Spend</h3>
                <p className="font-serif text-5xl text-[#fdfbf7]">$5.90</p>
                <p className="mt-4 text-xs text-[#fdfbf7]/50">Estimated API costs for current billing period.</p>
              </GlowCard>
              <GlowCard className="p-8" glowColor="rgba(16, 185, 129, 0.15)">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-4">Average Cost Per Run</h3>
                <p className="font-serif text-5xl text-[#fdfbf7]">$0.04</p>
                <p className="mt-4 text-xs text-emerald-500 font-medium">Highly optimized routing.</p>
              </GlowCard>
              <GlowCard className="p-8" glowColor="rgba(249, 115, 22, 0.15)">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-4">Most Expensive Route</h3>
                <p className="font-serif text-3xl text-[#fdfbf7] mb-2 truncate">Claude 3.5 Sonnet</p>
                <p className="text-xs text-[#fdfbf7]/50">Accounted for 54% of total costs.</p>
              </GlowCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
                <h2 className="font-serif text-xl text-[#fdfbf7] mb-8">Cost by Provider</h2>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#555" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                      <YAxis dataKey="name" type="category" stroke="#555" tick={{ fill: '#fdfbf7', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1a1a1a' }} />
                      <Bar dataKey="cost" name="Cost" radius={[0, 4, 4, 0]} barSize={24}>
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
                <h2 className="font-serif text-xl text-[#fdfbf7] mb-8">Spend Distribution</h2>
                <div className="h-[250px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="cost"
                        stroke="none"
                      >
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend overlay */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    {costData.map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-[#fdfbf7]/70">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "health" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#2a2a2a] bg-[#0c0b0a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-[#fdfbf7]">Provider Health Status</h2>
                  <p className="text-xs text-[#fdfbf7]/50 mt-1">Real-time telemetry from the orchestration layer.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Systems Nominal
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#151515] text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 border-b border-[#2a2a2a]">
                    <tr>
                      <th className="p-4 pl-8">Provider / Model</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Routing Role</th>
                      <th className="p-4">Avg Latency</th>
                      <th className="p-4">Uptime (30d)</th>
                      <th className="p-4 pr-8">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {healthData.map((row, i) => (
                      <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4 pl-8 font-serif text-[#fdfbf7]">{row.provider}</td>
                        <td className="p-4">
                          {row.status === "operational" ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Operational
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                              <AlertCircle className="h-3 w-3" /> Degraded
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-[#fdfbf7]/60 text-xs">{row.routing}</td>
                        <td className="p-4 font-mono text-xs text-[#fdfbf7]/80">{row.latency}</td>
                        <td className="p-4 font-mono text-xs text-[#fdfbf7]/80">{row.uptime}</td>
                        <td className="p-4 pr-8 font-mono text-xs">
                          <span className={parseFloat(row.errors) > 1 ? "text-amber-400" : "text-emerald-400"}>
                            {row.errors}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
                <h3 className="text-sm font-bold text-[#fdfbf7] mb-2">Fallback Triggered</h3>
                <p className="text-xs text-[#fdfbf7]/50 leading-relaxed">
                  The orchestrator successfully routed around 3 provider timeouts in the last 24 hours. The primary synthesis model (Claude) experienced elevated latency, triggering an automatic fallback to Gemini 2.0 Flash to maintain SLA.
                </p>
              </div>
              <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-6">
                <h3 className="text-sm font-bold text-[#fdfbf7] mb-2">Rate Limit Status</h3>
                <p className="text-xs text-[#fdfbf7]/50 leading-relaxed">
                  Currently utilizing 12% of the global DeepSeek API rate limit. No throttling events recorded in the current billing period. Firecrawl extraction limits are healthy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;