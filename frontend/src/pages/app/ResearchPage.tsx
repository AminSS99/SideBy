import React, { useState, useRef } from "react";
import { Microscope, Search, Sparkles, FileText, Clock3, ArrowRight, Loader2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ResearchReport {
  id: string;
  topic: string;
  status: "completed" | "researching";
  date: string;
  summary?: string;
  findings?: string[];
}

const ResearchPage = () => {
  const [query, setQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
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
      ]
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
    };

    setReports((prev) => [newReport, ...prev]);
    setQuery("");
    setIsResearching(true);

    // Simulate research job completion
    setTimeout(() => {
      setReports((prev) => 
        prev.map((report) => 
          report.id === newReport.id 
            ? {
                ...report,
                status: "completed",
                summary: `This is a synthesized research brief on "${report.topic}". The AI has analyzed multiple web sources and extracted key patterns.`,
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
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
            Deep Dive
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
            Research Canvas
          </h1>
          <p className="mt-4 max-w-3xl text-white/60 leading-relaxed">
            Run comprehensive, source-backed research on single entities, market trends, or technical concepts.
          </p>
        </div>
      </div>

      {/* Research Input */}
      <div className="res-input rounded-sm border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
        <form onSubmit={handleStartResearch} className="relative mx-auto max-w-3xl">
          <div className="group relative flex w-full flex-col items-center rounded-sm border border-[#333] bg-[#0c0b0a] p-2 transition-all focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 sm:flex-row">
            <Microscope className="ml-4 hidden h-6 w-6 text-white/30 sm:block group-focus-within:text-orange-500 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to research?"
              className="w-full bg-transparent px-4 py-3 text-lg text-white placeholder:text-white/20 outline-none sm:text-xl font-serif"
            />
            <button
              type="submit"
              disabled={!query.trim() || isResearching}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 sm:mt-0 sm:w-auto"
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
        </form>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <h2 className="res-report text-2xl font-serif text-[#fdfbf7] tracking-tight px-2">Recent Reports</h2>
        {reports.map((report) => (
          <article
            key={report.id}
            className="res-report rounded-sm border border-[#2a2a2a] bg-[#111] p-8 transition-colors hover:border-[#444]"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-sm border ${report.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                    {report.status === "completed" ? <FileText className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-[#fdfbf7]">{report.topic}</h3>
                    <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40">
                      <Clock3 className="h-3 w-3" />
                      {new Date(report.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {report.status === "completed" && report.summary && (
                  <div className="mt-6 space-y-5 pl-16">
                    <p className="text-sm leading-relaxed text-[#fdfbf7]/80 border-l-2 border-orange-500 pl-4 py-1">
                      {report.summary}
                    </p>
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Key Findings</span>
                      <ul className="space-y-3">
                        {report.findings?.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 lg:justify-end">
                <span className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${report.status === "completed" ? "bg-[#0c0b0a] border-[#333] text-white/60" : "bg-orange-500/10 border-orange-500/20 text-orange-400"}`}>
                  {report.status === "researching" ? "Analyzing Sources..." : "Completed"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ResearchPage;