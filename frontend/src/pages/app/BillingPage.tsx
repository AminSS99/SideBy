import React, { useRef, useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Zap, GitCompareArrows, MessageSquare, RefreshCw, Download } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

type UsageStatus = {
  plan: string;
  limits: {
    comparisonsPerDay: number;
    followUpsPerDay: number;
    refreshesPerDay: number;
    exportsPerDay: number;
  };
  usage: Record<string, { used: number; limit: number; remaining: number }>;
  billingConfigured: boolean;
  message: string;
};

const BillingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".bill-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".bill-card", { y: 20, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".bill-sidebar", { x: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: containerRef });

  useEffect(() => {
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
    void loadUsage();
  }, []);

  const usageItems = [
    { key: "comparison", label: "Comparisons", icon: GitCompareArrows, color: "text-orange-400" },
    { key: "followUp", label: "Follow-ups", icon: MessageSquare, color: "text-blue-400" },
    { key: "refresh", label: "Refreshes", icon: RefreshCw, color: "text-purple-400" },
    { key: "export", label: "Exports", icon: Download, color: "text-emerald-400" },
  ];

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="bill-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Subscription
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Billing & Plans
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          View your current plan usage. Paid plans with higher limits will be available soon.
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
                <h2 className="font-serif text-2xl text-[#fdfbf7]">Free Plan</h2>
                <p className="text-xs text-[#fdfbf7]/50">Everyone starts here. No credit card required.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-[#1a1a1a] rounded-sm" />
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
                  const pct = Math.min(100, (data.used / data.limit) * 100);
                  const isNearLimit = pct >= 80;
                  const isAtLimit = data.remaining === 0;

                  return (
                    <div key={item.key} className="rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-sm text-[#fdfbf7]">{item.label}</span>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-[#fdfbf7]/50"}`}>
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
          {/* Coming Soon */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-[#fdfbf7]/40" />
              <h3 className="font-serif text-xl text-[#fdfbf7]">Paid Plans</h3>
            </div>
            <p className="text-sm text-[#fdfbf7]/60 leading-relaxed mb-6">
              Pro and Team plans with higher limits, priority processing, and advanced features are coming soon.
            </p>
            <div className="rounded-sm border border-dashed border-[#333] bg-[#0c0b0a] p-4 text-center">
              <p className="text-xs text-[#fdfbf7]/40">No paid plans available yet.</p>
            </div>
          </div>

          {/* What's included */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <h3 className="mb-6 font-serif text-xl text-[#fdfbf7]">Free Plan Includes</h3>
            <ul className="space-y-4">
              {[
                `${usage?.limits.comparisonsPerDay || 5} comparisons per day`,
                `${usage?.limits.followUpsPerDay || 10} follow-ups per day`,
                `${usage?.limits.refreshesPerDay || 3} refreshes per day`,
                `${usage?.limits.exportsPerDay || 10} exports per day`,
                "Source-backed citations",
                "Public share links",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
