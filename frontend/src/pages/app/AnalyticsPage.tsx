import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ActivitySquare,
  AlertCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GlowCard } from "@/components/GlowCard";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

type Tab = "overview" | "taxonomy" | "costs" | "health";

type QualityResponse = {
  stats: {
    totalCompleted: number;
    totalFailed: number;
    totalVague: number;
    totalBlocked: number;
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
    error: string | null;
    retryCount: number;
    cost: number | null;
    updatedAt?: string;
  }>;
  lowConfidence: Array<{
    id: string;
    query: string;
    confidence: number | null;
    updatedAt?: string;
  }>;
  highCost: Array<{
    id: string;
    query: string;
    cost: number | null;
    updatedAt?: string;
  }>;
  categories: Array<{
    category: string | null;
    label: string;
    status: string | null;
    safetyLevel: string | null;
    count: number;
  }>;
  taxonomy: {
    safetyLevels: Array<{ safetyLevel: string | null; count: number }>;
    statuses: Array<{ status: string | null; count: number }>;
    policyNotes: Array<{ note: string | null; count: number }>;
  };
  feedback: Array<{ rating: number | null; count: number }>;
};

const currency = (value: number | null | undefined) =>
  value === null || value === undefined ? "n/a" : `$${value.toFixed(4)}`;

const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? "n/a" : `${Math.round(value * 100)}%`;

const AnalyticsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<QualityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch(buildApiUrl("/api/usage?type=quality"));
      const payload = (await res.json()) as QualityResponse;
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".stat-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".stat-nav", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.6")
      .from(".stat-content", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, { label: string; count: number; blocked: number }>();
    for (const item of data?.categories || []) {
      const key = item.category || "unknown";
      const existing = totals.get(key) || { label: item.label || key, count: 0, blocked: 0 };
      existing.count += item.count;
      if (item.safetyLevel === "blocked" || item.status === "sensitive" || item.status === "unsupported") {
        existing.blocked += item.count;
      }
      totals.set(key, existing);
    }
    return Array.from(totals.entries())
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.count - a.count);
  }, [data?.categories]);

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="stat-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Telemetry
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Platform Analytics
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
            Monitor real comparison quality, category demand, rejected queries, cache reuse, and provider spend from saved usage events.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-[#333] bg-[#111] px-4 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 transition-colors hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      <div className="stat-nav flex items-center gap-2 border-b border-[#2a2a2a] pb-px overflow-x-auto no-scrollbar">
        <NavButton active={activeTab === "overview"} icon={Activity} label="Usage Overview" onClick={() => setActiveTab("overview")} />
        <NavButton active={activeTab === "taxonomy"} icon={ShieldCheck} label="Taxonomy" onClick={() => setActiveTab("taxonomy")} />
        <NavButton active={activeTab === "costs"} icon={DollarSign} label="Cost Inspector" onClick={() => setActiveTab("costs")} />
        <NavButton active={activeTab === "health"} icon={ActivitySquare} label="Provider Health" onClick={() => setActiveTab("health")} />
      </div>

      <div className="stat-content">
        {isLoading ? (
          <StatePanel icon={Loader2} title="Loading analytics" description="Reading saved comparison telemetry from the database." spinning />
        ) : error ? (
          <StatePanel icon={AlertCircle} title="Analytics unavailable" description={error} tone="amber" />
        ) : !data ? (
          <StatePanel icon={AlertCircle} title="No analytics data" description="No usage events have been saved yet." tone="amber" />
        ) : activeTab === "overview" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Completed" value={data.stats.totalCompleted} />
              <Metric label="Failed" value={data.stats.totalFailed} />
              <Metric label="Blocked / Rejected" value={data.stats.totalBlocked} accent="text-red-300" />
              <Metric label="Avg Cost" value={currency(data.stats.avgCost)} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <ListPanel
                title="Low Confidence Runs"
                empty="No low-confidence completed runs."
                items={data.lowConfidence.map((item) => ({
                  title: item.query,
                  meta: `${percent(item.confidence)} confidence`,
                }))}
              />
              <ListPanel
                title="Failed Jobs"
                empty="No failed jobs recorded."
                items={data.failedJobs.map((item) => ({
                  title: item.query,
                  meta: item.error || `Retried ${item.retryCount} time${item.retryCount === 1 ? "" : "s"}`,
                }))}
              />
            </div>
          </div>
        ) : activeTab === "taxonomy" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Total Queries" value={data.cache.totalQueries} />
              <Metric label="Needs Context" value={data.stats.totalVague} />
              <Metric label="Blocked" value={data.stats.totalBlocked} accent="text-red-300" />
            </div>
            <div className="grid gap-6 xl:grid-cols-3">
              <BarPanel
                title="Category Demand"
                items={categoryTotals.map((item) => ({
                  label: item.label,
                  value: item.count,
                  note: item.blocked ? `${item.blocked} blocked` : undefined,
                }))}
              />
              <BarPanel
                title="Safety Levels"
                items={data.taxonomy.safetyLevels.map((item) => ({
                  label: item.safetyLevel || "unknown",
                  value: item.count,
                }))}
              />
              <BarPanel
                title="Policy Notes"
                items={data.taxonomy.policyNotes.map((item) => ({
                  label: item.note || "unknown",
                  value: item.count,
                }))}
                empty="No rejected policy notes yet."
              />
            </div>
          </div>
        ) : activeTab === "costs" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Cache Entries" value={data.cache.memorySize} />
              <Metric label="Reused Results" value={data.cache.reusedCount} />
              <Metric label="Reuse Rate" value={`${data.cache.reuseRate}%`} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <ListPanel
                title="High Cost Runs"
                empty="No cost-bearing runs recorded."
                items={data.highCost.map((item) => ({
                  title: item.query,
                  meta: currency(item.cost),
                }))}
              />
              <ListPanel
                title="Provider Spend"
                empty="No provider spend recorded."
                items={data.providerSpend.map((item) => ({
                  title: item.provider,
                  meta: `${currency(item.totalCost)} across ${item.callCount} calls`,
                }))}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Completed" value={data.stats.totalCompleted} />
              <Metric label="Failed" value={data.stats.totalFailed} accent="text-red-300" />
              <Metric label="Feedback Items" value={data.feedback.reduce((sum, item) => sum + item.count, 0)} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <BarPanel
                title="Taxonomy Status"
                items={data.taxonomy.statuses.map((item) => ({
                  label: item.status || "unknown",
                  value: item.count,
                }))}
              />
              <BarPanel
                title="Feedback Ratings"
                items={data.feedback.map((item) => ({
                  label: item.rating ? `${item.rating} star${item.rating === 1 ? "" : "s"}` : "unrated",
                  value: item.count,
                }))}
                empty="No feedback submitted yet."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NavButton = ({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
      active ? "text-orange-400" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
    {active && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-orange-500" />}
  </button>
);

const Metric = ({
  label,
  value,
  accent = "text-[#fdfbf7]",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <GlowCard className="p-6">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">{label}</p>
    <p className={`mt-3 font-serif text-4xl ${accent}`}>{value}</p>
  </GlowCard>
);

const StatePanel = ({
  icon: Icon,
  title,
  description,
  tone = "default",
  spinning = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tone?: "default" | "amber";
  spinning?: boolean;
}) => (
  <div className="flex flex-col items-center justify-center rounded-sm border border-[#2a2a2a] bg-[#111] p-12 text-center">
    <Icon className={`mb-6 h-10 w-10 ${spinning ? "animate-spin" : ""} ${tone === "amber" ? "text-amber-500/70" : "text-orange-500/70"}`} />
    <h2 className="mb-3 font-serif text-2xl text-[#fdfbf7]">{title}</h2>
    <p className="max-w-md text-sm leading-relaxed text-[#fdfbf7]/60">{description}</p>
  </div>
);

const ListPanel = ({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ title: string; meta: string }>;
  empty: string;
}) => (
  <GlowCard className="p-6">
    <h2 className="font-serif text-2xl text-[#fdfbf7]">{title}</h2>
    {items.length === 0 ? (
      <p className="mt-6 text-sm text-[#fdfbf7]/45">{empty}</p>
    ) : (
      <div className="mt-6 divide-y divide-[#2a2a2a]">
        {items.slice(0, 8).map((item) => (
          <div key={`${item.title}-${item.meta}`} className="py-4">
            <p className="line-clamp-1 text-sm font-medium text-[#fdfbf7]">{item.title}</p>
            <p className="mt-1 text-xs text-[#fdfbf7]/45">{item.meta}</p>
          </div>
        ))}
      </div>
    )}
  </GlowCard>
);

const BarPanel = ({
  title,
  items,
  empty = "No data recorded yet.",
}: {
  title: string;
  items: Array<{ label: string; value: number; note?: string }>;
  empty?: string;
}) => {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <GlowCard className="p-6">
      <h2 className="font-serif text-2xl text-[#fdfbf7]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#fdfbf7]/45">{empty}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {items.slice(0, 10).map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="line-clamp-1 font-bold uppercase tracking-widest text-[#fdfbf7]/60">{item.label}</span>
                <span className="shrink-0 text-[#fdfbf7]/40">{item.note || item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
};

export default AnalyticsPage;
