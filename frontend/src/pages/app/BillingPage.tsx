import React, { useRef, useState, useEffect } from "react";
import { KeyboardSpacer } from "@/components/KeyboardSpacer";

import { AlertCircle, CheckCircle2, Zap, GitCompareArrows, MessageSquare, RefreshCw, Download, ExternalLink, Globe } from "@/components/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { brand } from "@/config/brand";
import { toast } from "sonner";

type UsageStatus = {
  plan: string;
  limits: {
    comparisonsPerDay: number;
    followUpsPerDay: number;
    refreshesPerDay: number;
    exportsPerDay: number;
    watchlistsPerDay?: number;
    chatsPerDay?: number;
    contextImportsPerDay?: number;
    webSearchesPerDay?: number;
  };
  usage: Record<string, { used: number; limit: number; remaining: number }>;
  monthly?: Partial<Record<"comparison" | "webSearch", { used: number; limit: number; remaining: number }>>;
  billingConfigured: boolean;
  subscription?: {
    source: string;
    status: string;
    billingProvider: "dodo" | "snapsolve" | "none";
    entitlement: {
      allowed: boolean;
      feature: string;
      plan: string | null;
      reason: string | null;
      source: string | null;
      workspaceId: string | null;
    } | null;
    snapsolveWorkspace: {
      id: string;
      name: string;
      slug: string | null;
      plan: string | null;
    } | null;
  };
  message: string;
};

const SNAP_SOLVE_PLAN_NAMES: Record<string, string> = {
  free: "Flow",
  pro: "Pulse",
  team: "Core",
  business: "Orbit",
  flow: "Flow",
  pulse: "Pulse",
  core: "Core",
  orbit: "Orbit",
};

const getPlanInclusions = (plan?: string) => {
  const p = (plan ?? "free").toLowerCase();
  switch (p) {
    case "pulse":
    case "pro":
      return [
        "10 comparisons per day (up to 100 per month)",
        "30 follow-ups per day",
        "10 refreshes per day",
        "20 exports per day",
        "10 live web searches per day (up to 100 per month)",
        "Priority background queue execution",
      ];
    case "core":
    case "team":
      return [
        "25 comparisons per day (up to 300 per month)",
        "80 follow-ups per day",
        "25 refreshes per day",
        "50 exports per day",
        "25 live web searches per day (up to 300 per month)",
        "Priority background queue execution",
      ];
    case "orbit":
    case "business":
      return [
        "60 comparisons per day (up to 800 per month)",
        "200 follow-ups per day",
        "60 refreshes per day",
        "120 exports per day",
        "60 live web searches per day (up to 800 per month)",
        "Priority background queue execution",
      ];
    default:
      return [
        "5 comparisons per day",
        "10 follow-ups per day",
        "3 refreshes per day",
        "10 exports per day",
        "2 live web searches per day",
        "Source-backed citations",
        "Public share links",
      ];
  }
};

const BillingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".bill-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".bill-card", { y: 20, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".bill-sidebar", { x: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: containerRef });

  const loadUsage = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(buildApiUrl("/api/usage"));
      if (!res.ok) throw new Error("Unable to load usage.");
      const data = (await res.json()) as UsageStatus;
      setUsage(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load usage.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsage();
  }, []);

  const usageItems = [
    { key: "comparison", label: "Comparisons", icon: GitCompareArrows, color: "text-orange-400" },
    { key: "followUp", label: "Follow-ups", icon: MessageSquare, color: "text-blue-400" },
    { key: "refresh", label: "Refreshes", icon: RefreshCw, color: "text-purple-400" },
    { key: "export", label: "Exports", icon: Download, color: "text-emerald-400" },
    { key: "webSearch", label: "Live web searches", icon: Globe, color: "text-sky-400" },
  ];

  const monthlyItems = [
    { key: "comparison" as const, label: "Monthly comparisons", icon: GitCompareArrows, color: "text-orange-400" },
    { key: "webSearch" as const, label: "Monthly live web searches", icon: Globe, color: "text-sky-400" },
  ];

  const manageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await apiFetch(buildApiUrl("/api/billing/portal"), {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Unable to open billing portal.");
      }
      const data = (await response.json()) as { url?: string | null };
      if (!data.url) {
        throw new Error("No customer portal URL was returned.");
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error("Failed to load customer portal", {
        description: e instanceof Error ? e.message : "Make sure your billing environment is live.",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlanName = `${SNAP_SOLVE_PLAN_NAMES[usage?.plan ?? "free"] ?? "Flow"} Plan`;
  const isSnapSolveManaged =
    usage?.subscription?.billingProvider === "snapsolve" ||
    usage?.subscription?.source.startsWith("snapsolve_");
  const isSnapSolveSourced = usage?.subscription?.source.startsWith("snapsolve_");

  return (
    <div ref={containerRef} className="space-y-8 max-w-6xl">
      <div className="bill-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Subscription
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Billing & Plans
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          SideBy uses the same Flow, Pulse, Core, or Orbit subscription as the rest of your SnapSolve workspace.
          Plans and payment are managed centrally in SnapSolve — SideBy reads your entitlement and never grants
          paid access on its own.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Current Plan */}
          <div className="bill-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-500/10 border border-emerald-500/20">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-[#fdfbf7]">{currentPlanName}</h2>
                <p className="text-xs text-[#fdfbf7]/50">
                  {usage?.plan && usage.plan !== "free"
                    ? "Your shared SnapSolve workspace entitlement is active."
                    : "Flow is the shared free SnapSolve tier. No card required."}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-[#1a1a1a] rounded-sm" />
                ))}
              </div>
            ) : error ? (
              <div role="alert" className="rounded-sm border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200/90">
                <p className="font-semibold">Plan status unavailable</p>
                <p className="mt-1 text-amber-200/70">
                  We couldn't confirm your SnapSolve entitlement, so no plan level is shown and nothing was
                  upgraded or downgraded. The rest of SideBy keeps working.
                </p>
                <button
                  type="button"
                  onClick={() => void loadUsage()}
                  className="mt-3 inline-flex min-h-10 items-center rounded-sm border border-amber-400/30 px-3.5 text-[10px] font-bold uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  Retry
                </button>
              </div>
            ) : usage ? (
              <div className="space-y-4">
                {usageItems.map((item) => {
                  const data = usage.usage[item.key];
                  if (!data) return null;

                  const fallbackLimits: Record<string, number | undefined> = {
                    comparison: usage.limits?.comparisonsPerDay,
                    followUp: usage.limits?.followUpsPerDay,
                    refresh: usage.limits?.refreshesPerDay,
                    export: usage.limits?.exportsPerDay,
                    watchlists: usage.limits?.watchlistsPerDay,
                    webSearch: usage.limits?.webSearchesPerDay,
                  };
                  const resolvedLimit = data.limit ?? fallbackLimits[item.key];
                  const numericLimit =
                    typeof resolvedLimit === "number" && Number.isFinite(resolvedLimit) && resolvedLimit > 0
                      ? resolvedLimit
                      : null;
                  const limitVal =
                    numericLimit !== null
                      ? numericLimit
                      : typeof resolvedLimit === "number" && Number.isFinite(resolvedLimit)
                        ? resolvedLimit
                        : "—";
                  const pct = numericLimit ? Math.min(100, (data.used / numericLimit) * 100) : 0;
                  const isAtLimit = data.remaining === 0;
                  const isNearLimit = !isAtLimit && numericLimit !== null && pct >= 80;

                  return (
                    <div key={item.key} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-sm text-[#fdfbf7]">{item.label}</span>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-[#fdfbf7]/50"}`}>
                          {data.used} / {limitVal}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {isAtLimit && (
                        <p className="mt-2 text-[10px] text-red-400 uppercase tracking-widest font-bold">
                          Daily limit reached — resets at midnight UTC
                        </p>
                      )}
                    </div>
                  );
                })}

                {usage.monthly && Object.keys(usage.monthly).length > 0 && (
                  <div className="pt-2 space-y-4">
                    {monthlyItems.map((item) => {
                      const data = usage.monthly?.[item.key];
                      if (!data || typeof data.limit !== "number" || !Number.isFinite(data.limit)) return null;

                      const pct = data.limit > 0 ? Math.min(100, (data.used / data.limit) * 100) : 0;
                      const isAtLimit = data.remaining === 0;
                      const isNearLimit = !isAtLimit && pct >= 80;

                      return (
                        <div key={`monthly-${item.key}`} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <item.icon className={`h-4 w-4 ${item.color}`} />
                              <span className="text-sm text-[#fdfbf7]">{item.label}</span>
                              <span className="rounded-sm border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#fdfbf7]/50">
                                Monthly
                              </span>
                            </div>
                            <span
                              className={`text-xs font-bold uppercase tracking-widest ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-[#fdfbf7]/50"}`}
                            >
                              {data.used} / {data.limit}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {isAtLimit && (
                            <p className="mt-2 text-[10px] text-red-400 uppercase tracking-widest font-bold">
                              Monthly limit reached, resets on the 1st (UTC)
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="mt-4 text-xs text-[#fdfbf7]/50 leading-relaxed">
                  One SnapSolve plan covers all your SnapSolve products, so SideBy limits are shared fairly.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bill-sidebar lg:col-span-4 space-y-6 sticky top-24">
          {/* Plan Settings Card */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-[#fdfbf7]/40" />
              <h3 className="font-serif text-xl text-[#fdfbf7]">
                {usage?.plan && usage.plan !== "free" ? "Manage Plan" : "Available Plans"}
              </h3>
            </div>
            
            {usage?.plan && usage.plan !== "free" ? (
              <div className="space-y-4">
                <p className="text-sm text-[#fdfbf7]/60 leading-relaxed">
                  Manage your billing profiles, view previous invoices, update card methods, or cancel subscription inside the secure customer portal.
                </p>
                {usage.subscription && (
                  <div className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-3 text-xs text-[#fdfbf7]/50">
                    <p className="font-bold uppercase tracking-widest text-[#fdfbf7]/70">
                      {isSnapSolveSourced ? "SnapSolve ecosystem" : "Local billing"}
                    </p>
                    <p className="mt-1">
                      Source: {usage.subscription.source.replace(/_/g, " ")}
                    </p>
                    {usage.subscription.snapsolveWorkspace && (
                      <p className="mt-1">
                        Workspace: {usage.subscription.snapsolveWorkspace.name}
                      </p>
                    )}
                  </div>
                )}
                {isSnapSolveManaged ? (
                  <a
                    href={brand.billingUrl}
                    className="w-full flex items-center justify-center gap-2 rounded-sm bg-orange-600 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage in SnapSolve
                  </a>
                ) : (
                  <button
                    onClick={manageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-sm bg-orange-600 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {portalLoading ? "Opening..." : "Customer Portal"}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#fdfbf7]/60 leading-relaxed">
                  SideBy does not have a separate subscription. Review Flow, Pulse, Core, and Orbit once in SnapSolve Cockpit.
                </p>
                <a
                  href={brand.billingUrl}
                  className="flex items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open SnapSolve Plans
                </a>
              </div>
            )}
          </div>

          {/* Plan Inclusion List */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <h3 className="mb-6 font-serif text-xl text-[#fdfbf7]">
              {usage?.plan && usage.plan !== "free" ? "Your Plan Inclusions" : "Flow Includes"}
            </h3>
            <ul className="space-y-4">
              {getPlanInclusions(usage?.plan).map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70">
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 shrink-0 ${usage?.plan && usage.plan !== "free" ? "text-orange-500" : "text-emerald-500"}`}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-[#1f1f1f] text-center text-xs text-[#fdfbf7]/60">
        <a href={brand.companyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
          Made by SnapSolve Ink
        </a>
      </div>
  <KeyboardSpacer />
    </div>
  );
};

export default BillingPage;
