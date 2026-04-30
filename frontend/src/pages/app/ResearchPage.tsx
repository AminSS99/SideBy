import React, { useState } from "react";
import { Microscope, Search, Sparkles, FileText, Clock3, ArrowRight, Loader2 } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
            Deep Dive
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
            Research Canvas
          </h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Run comprehensive, source-backed research on single entities, market trends, or technical concepts.
          </p>
        </div>
      </div>

      {/* Research Input */}
      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6 sm:p-8">
        <form onSubmit={handleStartResearch} className="relative mx-auto max-w-3xl">
          <div className="group relative flex w-full flex-col items-center rounded-2xl border border-[#333] bg-[#0c0b0a] p-2 transition-all focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 sm:flex-row">
            <Microscope className="ml-4 hidden h-6 w-6 text-white/30 sm:block" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to research?"
              className="w-full bg-transparent px-4 py-3 text-lg text-white placeholder:text-white/20 outline-none sm:text-xl"
            />
            <button
              type="submit"
              disabled={!query.trim() || isResearching}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 sm:mt-0 sm:w-auto"
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
        <h2 className="text-xl font-bold text-white px-2">Recent Reports</h2>
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-[28px] border border-white/10 bg-black/30 p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${report.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"}`}>
                    {report.status === "completed" ? <FileText className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{report.topic}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      <Clock3 className="h-3 w-3" />
                      {new Date(report.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {report.status === "completed" && report.summary && (
                  <div className="mt-6 space-y-4 pl-12">
                    <p className="text-sm leading-relaxed text-white/70">
                      {report.summary}
                    </p>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Key Findings</span>
                      <ul className="space-y-2">
                        {report.findings?.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-white/60">
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
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${report.status === "completed" ? "bg-white/10 text-white/60" : "bg-orange-500/20 text-orange-300"}`}>
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