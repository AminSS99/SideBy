import React, { useEffect, useState, useRef } from "react";
import { AlertCircle, TrendingDown, DollarSign, BarChart3, Hash, Zap, Cpu } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { GlowCard } from "@/components/GlowCard";

type QualityData = {
  stats: {
    totalCompleted: number;
    totalFailed: number;
    totalVague: number;
    avgCost: number | null;
  };
  cache: {
    memorySize: number;
    totalQueries: number;
    reusedCount: number;
    reuseRate: number;
  };
  providerSpend: Array<{
    provider: string;
    totalCost: number;
    callCount: number;
    avgCostPerCall: number;
  }>;
  failedJobs: Array<{
    id: string;
    query: string;
    slug: string;
    error: string | null;
    retryCount: number;
    cost: number | null;
    updatedAt: string | undefined;
  }>;
  lowConfidence: Array<{
    id: string;
    query: string;
    slug: string;
    confidence: number | null;
    updatedAt: string | undefined;
  }>;
  highCost: Array<{
    id: string;
    query: string;
    slug: string;
    cost: number | null;
    updatedAt: string | undefined;
  }>;
  categories: Array<{
    category: string;
    count: number;
  }>;
  feedback: Array<{
    rating: number;
    count: number;
  }>;
};

const QualityPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/usage?type=quality")
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".q-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".q-stats", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.6")
      .from(".q-section", { y: 20, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  if (loading) {
    return <div className="p-8 text-white/30 text-sm">Loading quality data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400 text-sm">Error: {error}</div>;
  }

  if (!data) return null;

  const failedPct = data.stats.totalCompleted + data.stats.totalFailed > 0
    ? Math.round((data.stats.totalFailed / (data.stats.totalCompleted + data.stats.totalFailed)) * 100)
    : 0;

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="q-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
          Phase 10
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Quality Dashboard
        </h1>
        <p className="mt-2 text-sm text-white/40 max-w-xl">
          Failed comparisons, low-confidence outputs, cost outliers, and usage patterns.
        </p>
      </div>

      {/* Stats row */}
      <div className="q-stats grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlowCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Completed</span>
          </div>
          <p className="font-serif text-3xl text-[#fdfbf7]">{data.stats.totalCompleted}</p>
        </GlowCard>
        <GlowCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Failed</span>
          </div>
          <p className="font-serif text-3xl text-[#fdfbf7]">
            {data.stats.totalFailed}
            <span className="text-sm text-red-400 ml-2">{failedPct}%</span>
          </p>
        </GlowCard>
        <GlowCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-amber-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Vague Queries</span>
          </div>
          <p className="font-serif text-3xl text-[#fdfbf7]">{data.stats.totalVague}</p>
        </GlowCard>
        <GlowCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-cyan-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Avg Cost</span>
          </div>
          <p className="font-serif text-3xl text-[#fdfbf7]">
            {data.stats.avgCost ? `$${data.stats.avgCost.toFixed(2)}` : "—"}
          </p>
        </GlowCard>
      </div>

      {/* Failed jobs */}
      <div className="q-section">
        <h2 className="font-serif text-xl text-[#fdfbf7] mb-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          Failed Comparisons
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{data.failedJobs.length} recent</span>
        </h2>
        {data.failedJobs.length === 0 ? (
          <p className="text-sm text-white/30">No failed comparisons. 🎉</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {data.failedJobs.map((job) => (
              <div key={job.id} className="rounded-sm border border-red-500/20 bg-red-500/[0.03] p-4">
                <p className="text-sm font-serif text-[#fdfbf7] mb-2">{job.query}</p>
                <p className="text-[10px] text-red-400 font-mono mb-1">{(job.error || "").slice(0, 120)}</p>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-white/30">
                  <span>Retries: {job.retryCount}</span>
                  {job.cost && <span>Cost: ${job.cost.toFixed(2)}</span>}
                  {job.updatedAt && <span>{new Date(job.updatedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low confidence */}
      <div className="q-section">
        <h2 className="font-serif text-xl text-[#fdfbf7] mb-4 flex items-center gap-3">
          <TrendingDown className="h-5 w-5 text-amber-400" />
          Low Confidence (&lt;70%)
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{data.lowConfidence.length} comparisons</span>
        </h2>
        {data.lowConfidence.length === 0 ? (
          <p className="text-sm text-white/30">All comparisons have healthy confidence.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {data.lowConfidence.map((jc) => (
              <div key={jc.id} className="rounded-sm border border-amber-500/20 bg-amber-500/[0.03] p-4 flex items-center justify-between">
                <p className="text-sm font-serif text-[#fdfbf7]">{jc.query}</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 shrink-0 ml-4">
                  {jc.confidence ? `${Math.round(jc.confidence * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* High cost */}
      <div className="q-section">
        <h2 className="font-serif text-xl text-[#fdfbf7] mb-4 flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-cyan-400" />
          Highest Cost Comparisons
        </h2>
        {data.highCost.filter((j) => j.cost).length === 0 ? (
          <p className="text-sm text-white/30">No cost data yet.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {data.highCost.filter((j) => j.cost).slice(0, 10).map((hc) => (
              <div key={hc.id} className="rounded-sm border border-cyan-500/20 bg-cyan-500/[0.03] p-4 flex items-center justify-between">
                <p className="text-sm font-serif text-[#fdfbf7]">{hc.query}</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 shrink-0 ml-4">
                  ${hc.cost?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 12: Cache & Reuse Stats */}
      <div className="q-section">
        <h2 className="font-serif text-xl text-[#fdfbf7] mb-4 flex items-center gap-3">
          <Zap className="h-5 w-5 text-yellow-400" />
          Cache &amp; Reuse
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlowCard className="p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Memory Cache</p>
            <p className="font-serif text-2xl text-[#fdfbf7]">{data.cache.memorySize}</p>
            <p className="text-[9px] text-white/30">entries</p>
          </GlowCard>
          <GlowCard className="p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Reuse Rate</p>
            <p className="font-serif text-2xl text-[#fdfbf7]">{data.cache.reuseRate}%</p>
            <p className="text-[9px] text-white/30">{data.cache.reusedCount} of {data.cache.totalQueries}</p>
          </GlowCard>
          <GlowCard className="p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Total Spent</p>
            <p className="font-serif text-2xl text-[#fdfbf7]">{data.stats.avgCost ? `$${data.stats.avgCost.toFixed(3)}` : "—"}</p>
            <p className="text-[9px] text-white/30">avg per query</p>
          </GlowCard>
          <GlowCard className="p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Completed</p>
            <p className="font-serif text-2xl text-emerald-400">{data.stats.totalCompleted}</p>
            <p className="text-[9px] text-white/30">queries</p>
          </GlowCard>
        </div>
      </div>

      {/* Phase 12: AI Provider Spend */}
      {data.providerSpend.length > 0 && (
        <div className="q-section">
          <h2 className="font-serif text-xl text-[#fdfbf7] mb-4 flex items-center gap-3">
            <Cpu className="h-5 w-5 text-blue-400" />
            AI Provider Spend
          </h2>
          <div className="space-y-2">
            {data.providerSpend.map((p) => (
              <div key={p.provider} className="rounded-sm border border-blue-500/20 bg-blue-500/[0.03] p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-serif text-[#fdfbf7]">{p.provider}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">{p.callCount} calls</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-400 font-mono">${p.totalCost.toFixed(2)}</p>
                  <p className="text-[9px] text-white/30">${p.avgCostPerCall.toFixed(4)}/call</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Categories */}
      <div className="q-section">
        <h2 className="font-serif text-xl text-[#fdfbf7] mb-4 flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-purple-400" />
          Comparison Categories
        </h2>
        {data.categories.length === 0 ? (
          <p className="text-sm text-white/30">No category data yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {(() => {
              const max = Math.max(...data.categories.map((c) => c.count));
              return data.categories.map((cat) => {
                const pct = Math.max(1, Math.round((cat.count / max) * 100));
                return (
                  <div key={cat.category} className="rounded-sm border border-white/[0.06] bg-[#0c0b0a] p-4 min-w-[140px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">{cat.category}</p>
                    <p className="font-serif text-2xl text-[#fdfbf7] mb-1">{cat.count}</p>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500/50 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityPage;
