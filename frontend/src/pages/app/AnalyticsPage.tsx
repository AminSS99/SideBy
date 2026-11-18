import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ActivitySquare,
  AlertCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "@/components/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GlowCard } from "@/components/GlowCard";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { statusLabel, useT } from "@/i18n";

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

const currency = (value: number | null | undefined, na: string) =>
  value === null || value === undefined ? na : `$${value.toFixed(4)}`;

const percent = (value: number | null | undefined, na: string) =>
  value === null || value === undefined ? na : `${Math.round(value * 100)}%`;

const AnalyticsPage = () => {
  const t = useT();
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
      setError(loadError instanceof Error ? loadError.message : t("ins.analytics.loadError"));
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
      const existing = totals.get(key) || { label: item.label || item.category || t("ins.common.unknown"), count: 0, blocked: 0 };
      existing.count += item.count;
      if (item.safetyLevel === "blocked" || item.status === "sensitive" || item.status === "unsupported") {
        existing.blocked += item.count;
      }
      totals.set(key, existing);
    }
    return Array.from(totals.entries())
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.count - a.count);
  }, [data?.categories, t]);

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="stat-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {t("ins.analytics.kicker")}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            {t("ins.analytics.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
            {t("ins.analytics.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-[#333] bg-[#111] px-4 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70 transition-colors hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {t("ins.common.refresh")}
        </button>
      </div>

      <div className="stat-nav grid grid-cols-2 gap-1.5 border-b border-[#2a2a2a] pb-2 sm:flex sm:items-center sm:gap-2 sm:pb-px sm:overflow-x-auto sm:no-scrollbar">
        <NavButton active={activeTab === "overview"} icon={Activity} label={t("ins.analytics.tab.overview")} onClick={() => setActiveTab("overview")} />
        <NavButton active={activeTab === "taxonomy"} icon={ShieldCheck} label={t("ins.analytics.tab.taxonomy")} onClick={() => setActiveTab("taxonomy")} />
        <NavButton active={activeTab === "costs"} icon={DollarSign} label={t("ins.analytics.tab.costs")} onClick={() => setActiveTab("costs")} />
        <NavButton active={activeTab === "health"} icon={ActivitySquare} label={t("ins.analytics.tab.health")} onClick={() => setActiveTab("health")} />
      </div>

      <div className="stat-content">
        {isLoading ? (
          <StatePanel icon={Loader2} title={t("ins.analytics.loadingTitle")} description={t("ins.analytics.loadingDesc")} spinning />
        ) : error ? (
          <StatePanel icon={AlertCircle} title={t("ins.analytics.errorTitle")} description={error} tone="amber" />
        ) : !data ? (
          <StatePanel icon={AlertCircle} title={t("ins.analytics.emptyTitle")} description={t("ins.analytics.emptyDesc")} tone="amber" />
        ) : activeTab === "overview" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label={t("ins.analytics.metric.completed")} value={data.stats.totalCompleted} />
              <Metric label={t("ins.analytics.metric.failed")} value={data.stats.totalFailed} />
              <Metric label={t("ins.analytics.metric.blockedRejected")} value={data.stats.totalBlocked} accent="text-red-300" />
              <Metric label={t("ins.analytics.metric.avgCost")} value={currency(data.stats.avgCost, t("ins.common.na"))} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <ListPanel
                title={t("ins.analytics.lowConfidence.title")}
                empty={t("ins.analytics.lowConfidence.empty")}
                items={data.lowConfidence.map((item) => ({
                  title: item.query,
                  meta: t("ins.analytics.lowConfidence.meta", { value: percent(item.confidence, t("ins.common.na")) }),
                }))}
              />
              <ListPanel
                title={t("ins.analytics.failedJobs.title")}
                empty={t("ins.analytics.failedJobs.empty")}
                items={data.failedJobs.map((item) => ({
                  title: item.query,
                  meta:
                    item.error ||
                    (item.retryCount === 1
                      ? t("ins.analytics.failedJobs.retriedOne")
                      : t("ins.analytics.failedJobs.retriedMany", { count: item.retryCount })),
                }))}
              />
            </div>
          </div>
        ) : activeTab === "taxonomy" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label={t("ins.analytics.metric.totalQueries")} value={data.cache.totalQueries} />
              <Metric label={t("ins.analytics.metric.needsContext")} value={data.stats.totalVague} />
              <Metric label={t("ins.analytics.metric.blocked")} value={data.stats.totalBlocked} accent="text-red-300" />
            </div>
            <div className="grid gap-6 xl:grid-cols-3">
              <BarPanel
                title={t("ins.analytics.categoryDemand.title")}
                items={categoryTotals.map((item) => ({
                  label: item.label,
                  value: item.count,
                  note: item.blocked ? t("ins.analytics.categoryDemand.blockedNote", { count: item.blocked }) : undefined,
                }))}
              />
              <BarPanel
                title={t("ins.analytics.safetyLevels.title")}
                items={data.taxonomy.safetyLevels.map((item) => ({
                  label: item.safetyLevel || t("ins.common.unknown"),
                  value: item.count,
                }))}
              />
              <BarPanel
                title={t("ins.analytics.policyNotes.title")}
                items={data.taxonomy.policyNotes.map((item) => ({
                  label: item.note || t("ins.common.unknown"),
                  value: item.count,
                }))}
                empty={t("ins.analytics.policyNotes.empty")}
              />
            </div>
          </div>
        ) : activeTab === "costs" ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label={t("ins.analytics.metric.cacheEntries")} value={data.cache.memorySize} />
              <Metric label={t("ins.analytics.metric.reusedResults")} value={data.cache.reusedCount} />
              <Metric label={t("ins.analytics.metric.reuseRate")} value={`${data.cache.reuseRate}%`} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <ListPanel
                title={t("ins.analytics.highCost.title")}
                empty={t("ins.analytics.highCost.empty")}
                items={data.highCost.map((item) => ({
                  title: item.query,
                  meta: currency(item.cost, t("ins.common.na")),
                }))}
              />
              <ListPanel
                title={t("ins.analytics.providerSpend.title")}
                empty={t("ins.analytics.providerSpend.empty")}
                items={data.providerSpend.map((item) => ({
                  title: item.provider,
                  meta: t("ins.analytics.providerSpend.meta", {
                    cost: currency(item.totalCost, t("ins.common.na")),
                    count: item.callCount,
                  }),
                }))}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label={t("ins.analytics.metric.completed")} value={data.stats.totalCompleted} />
              <Metric label={t("ins.analytics.metric.failed")} value={data.stats.totalFailed} accent="text-red-300" />
              <Metric label={t("ins.analytics.metric.feedbackItems")} value={data.feedback.reduce((sum, item) => sum + item.count, 0)} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <BarPanel
                title={t("ins.analytics.taxonomyStatus.title")}
                items={data.taxonomy.statuses.map((item) => ({
                  label: item.status ? statusLabel(t, item.status) : t("ins.common.unknown"),
                  value: item.count,
                }))}
              />
              <BarPanel
                title={t("ins.analytics.feedbackRatings.title")}
                items={data.feedback.map((item) => ({
                  label: item.rating
                    ? item.rating === 1
                      ? t("ins.analytics.ratingOne")
                      : t("ins.analytics.ratingMany", { count: item.rating })
                    : t("ins.analytics.unrated"),
                  value: item.count,
                }))}
                empty={t("ins.analytics.feedbackRatings.empty")}
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
  empty,
}: {
  title: string;
  items: Array<{ label: string; value: number; note?: string }>;
  empty?: string;
}) => {
  const t = useT();
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <GlowCard className="p-6">
      <h2 className="font-serif text-2xl text-[#fdfbf7]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#fdfbf7]/45">{empty ?? t("ins.analytics.noData")}</p>
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
