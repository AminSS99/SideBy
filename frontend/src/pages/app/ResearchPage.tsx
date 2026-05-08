import React, { useState, useRef } from "react";
import { Microscope, Sparkles, FileText, Clock3, ArrowRight, Loader2, Settings2, Globe, Cpu, SlidersHorizontal } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/GlowCard";

interface ResearchReport {
  id: string;
  topic: string;
  status: "completed" | "researching";
  date: string;
  summary?: string;
  findings?: string[];
  config?: {
    depth: string;
    model: string;
  };
}

const ResearchPage = () => {
  const [query, setQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Advanced Config State
  const [depth, setDepth] = useState("standard");
  const [model, setModel] = useState("auto");
  const [domains, setDomains] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const [reports, setReports] = useState<ResearchReport[]>([
    {
      id: "1",
      topic: "State of Serverless Postgres in 2024",
      status: "completed",
      date: new Date().toISOString(),
      summary: "Serverless Postgres has matured significantly, with Neon and Supabase leading the developer experience. Cold starts have been reduced to sub-100ms in many regions.",
      findings: [
        "Neon's separation of storage and compute allows for instant branching.",
        "Supabase now offers branching but relies heavily on standard Postgres replication under the hood.",
        "Connection pooling (like PgBouncer or Supavisor) is mandatory for serverless environments."
      ],
      config: { depth: "deep", model: "auto" }
    }
  ]);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".res-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".res-input", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".res-report", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");
  }, { scope: containerRef });

  const handleStartResearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isResearching) return;

    const newReport: ResearchReport = {
      id: Date.now().toString(),
      topic: query.trim(),
      status: "researching",
      date: new Date().toISOString(),
      config: { depth, model }
    };

    setReports((prev) => [newReport, ...prev]);
    setQuery("");
    setShowConfig(false);
    setIsResearching(true);

    // Simulate research job completion
    setTimeout(() => {
      setReports((prev) => 
        prev.map((report) => 
          report.id === newReport.id 
            ? {
                ...report,
                status: "completed",
                summary: `This is a synthesized research brief on "${report.topic}". The engine analyzed multiple web sources using the ${report.config?.model === 'auto' ? 'optimal multi-model routing' : report.config?.model + ' model'}.`,
                findings: [
                  "Initial market analysis shows growing adoption in enterprise sectors.",
                  "Key players are aggressively competing on pricing and developer experience.",
                  "Integration ecosystems remain the strongest moat for established products."
                ]
              }
            : report
        )
      );
      setIsResearching(false);
    }, 3000);
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="res-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Deep Dive
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Research Canvas
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
            Run comprehensive, source-backed research on single entities, market trends, or technical concepts.
          </p>
        </div>
      </div>

      {/* Research Input & Config */}
      <div className="res-input rounded-sm border border-[#2a2a2a] bg-[#111] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient background for the form area */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

        <form onSubmit={handleStartResearch} className="relative z-10 mx-auto max-w-4xl">
          <div className="group relative flex w-full flex-col items-stretch rounded-sm border border-[#333] bg-[#0c0b0a] p-2 transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 sm:flex-row shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <div className="flex flex-1 items-center">
              <Microscope className="ml-4 hidden h-5 w-5 text-[#fdfbf7]/30 sm:block group-focus-within:text-emerald-500 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to research? e.g. RAG architecture patterns"
                className="w-full bg-transparent px-4 py-3 text-base sm:text-lg text-[#fdfbf7] placeholder:text-[#fdfbf7]/30 outline-none font-serif"
              />
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:pr-2">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm border transition-colors ${
                  showConfig 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-[#111] border-[#333] text-[#fdfbf7]/50 hover:text-[#fdfbf7] hover:border-[#555]"
                }`}
                title="Advanced Configuration"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={!query.trim() || isResearching}
                className="flex h-10 sm:h-12 flex-1 sm:flex-none items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-6 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running
                  </>
                ) : (
                  <>
                    Start
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Configuration Panel */}
          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-6 grid gap-6 sm:grid-cols-3">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                      <SlidersHorizontal className="h-3 w-3" /> Research Depth
                    </label>
                    <select 
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full h-10 rounded-sm border border-[#333] bg-[#111] px-3 text-sm text-[#fdfbf7] outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="quick">Quick Sweep (~10s)</option>
                      <option value="standard">Standard Deep Dive (~30s)</option>
                      <option value="extreme">Extreme Resolution (~2m)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                      <Cpu className="h-3 w-3" /> Model Routing
                    </label>
                    <select 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full h-10 rounded-sm border border-[#333] bg-[#111] px-3 text-sm text-[#fdfbf7] outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="auto">Auto Orchestration (Best)</option>
                      <option value="deepseek">Force DeepSeek V4 Pro</option>
                      <option value="gemini">Force Gemini 3.1 Pro</option>
                      <option value="claude">Force Claude 3.5 Sonnet</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                      <Globe className="h-3 w-3" /> Domain Filter
                    </label>
                    <input 
                      type="text"
                      value={domains}
                      onChange={(e) => setDomains(e.target.value)}
                      placeholder="e.g. github.com, docs.*"
                      className="w-full h-10 rounded-sm border border-[#333] bg-[#111] px-3 text-sm text-[#fdfbf7] placeholder:text-[#fdfbf7]/30 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <h2 className="res-report text-2xl font-serif text-[#fdfbf7] tracking-tight px-2">Recent Reports</h2>
        {reports.map((report) => (
          <GlowCard
            key={report.id}
            glowColor={report.status === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(234, 88, 12, 0.15)"}
            containerClassName="res-report"
            className="p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border ${report.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                    {report.status === "completed" ? <FileText className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-serif text-[#fdfbf7] truncate">{report.topic}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-widest font-bold text-[#fdfbf7]/40">
                      <span className="flex items-center gap-1.5"><Clock3 className="h-3 w-3" />{new Date(report.date).toLocaleDateString()}</span>
                      {report.config && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[#333]" />
                          <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3 w-3" />{report.config.depth} depth</span>
                          <span className="h-1 w-1 rounded-full bg-[#333]" />
                          <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3" />{report.config.model} route</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {report.status === "completed" && report.summary && (
                  <div className="mt-8 space-y-6 lg:pl-16">
                    <p className="text-sm leading-relaxed text-[#fdfbf7]/80 border-l-2 border-emerald-500 pl-5 py-1 bg-emerald-500/[0.02]">
                      {report.summary}
                    </p>
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-emerald-500" /> Key Findings
                      </span>
                      <ul className="space-y-3">
                        {report.findings?.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70 leading-relaxed">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/50" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 lg:justify-end mt-4 lg:mt-0">
                <span className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${report.status === "completed" ? "bg-[#0c0b0a] border-[#333] text-[#fdfbf7]/60" : "bg-orange-500/10 border-orange-500/20 text-orange-400"}`}>
                  {report.status === "researching" ? "Analyzing Sources..." : "Completed"}
                </span>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
};

export default ResearchPage;
