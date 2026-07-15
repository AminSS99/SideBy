import React, { useRef, useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Zap, GitCompareArrows, MessageSquare, RefreshCw, Download, ExternalLink } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";

type UsageStatus = {
  plan: string;
  limits: {
    comparisonsPerDay: number;
    followUpsPerDay: number;
    refreshesPerDay: number;
    exportsPerDay: number;
    watchlistsPerDay?: number;
  };
  usage: Record<string, { used: number; limit: number; remaining: number }>;
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
  ];

  const requestUpgrade = async (plan: "pro" | "team") => {
    try {
      const response = await apiFetch(buildApiUrl("/api/billing/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
        }),
      });
      const data = (await response.json()) as { checkoutUrl?: string | null };
      if (!data.checkoutUrl) {
        toast.error("Checkout is not available yet.", {
          description: "Check your Dodo Payments product configuration.",
        });
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error("Checkout failed", {
        description: err instanceof Error ? err.message : "Try again shortly.",
      });
    }
  };

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

  const currentPlanName = usage?.plan 
    ? usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1) + " Plan" 
    : "Free Plan";
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
          Monitor your usage parameters and subscription states in real-time. Complete comparisons limitlessly on a paid plan.
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
                    ? "Your high-volume developer workspace limits are active." 
                    : "Everyone starts here. No credit card required."}
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
              <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400">
                {error}
              </div>
            ) : usage ? (
              <div className="space-y-4">
                {usageItems.map((item) => {
                  const data = usage.usage[item.key];
                  if (!data) return null;

                  const isUnlimited = usage.plan !== "free";
                  const limitVal = isUnlimited ? "Unlimited" : data.limit;
                  const pct = isUnlimited ? 0 : Math.min(100, (data.used / data.limit) * 100);
                  const isNearLimit = !isUnlimited && pct >= 80;
                  const isAtLimit = !isUnlimited && data.remaining === 0;

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
                      {!isUnlimited && (
                        <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                      {isAtLimit && (
                        <p className="mt-2 text-[10px] text-red-400 uppercase tracking-widest font-bold">
                          Daily limit reached — resets at midnight UTC
                        </p>
                      )}
                    </div>
                  );
                })}
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
                    href="https://sideby.ink"
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
                  Pro and Team plans with higher limits, priority processing, and advanced features are available for checkout.
                </p>
                {usage?.subscription?.billingProvider === "snapsolve" ? (
                  <a
                    href="https://sideby.ink"
                    className="flex items-center justify-center gap-2 rounded-sm bg-[#fdfbf7] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open SnapSolve Plans
                  </a>
                ) : (
                  <div className="grid gap-2">
                    <button
                      onClick={() => void requestUpgrade("pro")}
                      className="rounded-sm bg-[#fdfbf7] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
                    >
                      Upgrade to Pro
                    </button>
                    <button
                      onClick={() => void requestUpgrade("team")}
                      className="rounded-sm border border-[#333] px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                    >
                      Upgrade Team
                    </button>
                    <a
                      href="mailto:hello@sideby.ink?subject=SideBy%20Team%20Plan"
                      className="rounded-sm border border-[#333] px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-orange-500/40 hover:text-orange-300"
                    >
                      Contact Sales
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan Inclusion List */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <h3 className="mb-6 font-serif text-xl text-[#fdfbf7]">
              {usage?.plan && usage.plan !== "free" ? "Your Plan Inclusions" : "Free Plan Includes"}
            </h3>
            <ul className="space-y-4">
              {usage?.plan && usage.plan !== "free" ? (
                [
                  "Unlimited comparisons per day",
                  "Unlimited follow-ups per day",
                  "Unlimited refreshes per day",
                  "Unlimited exports per day",
                  "Priority background queue execution",
                  "Webhook subscription dispatchers",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{feature}</span>
                  </li>
                ))
              ) : (
                [
                  "5 comparisons per day",
                  "10 follow-ups per day",
                  "3 refreshes per day",
                  "10 exports per day",
                  "Source-backed citations",
                  "Public share links",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-[#1f1f1f] text-center text-xs text-[#fdfbf7]/60">
        <a href="https://sideby.ink" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
          Made by SnapSolve Ink
        </a>
      </div>
    </div>
  );
};

export default BillingPage;
