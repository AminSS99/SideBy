import React, { useState, useRef } from "react";
import { Activity, DollarSign, ActivitySquare, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GlowCard } from "@/components/GlowCard";

type Tab = "overview" | "costs" | "health";

const AnalyticsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Phase 1: Analytics will be wired to real usage events in Phase 6.
  const analyticsConfigured = false;

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
        {!analyticsConfigured ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-[#2a2a2a] bg-[#111] p-12 text-center animate-in fade-in duration-500">
            <AlertCircle className="h-10 w-10 text-amber-500/60 mb-6" />
            <h2 className="font-serif text-2xl text-[#fdfbf7] mb-3">Analytics not configured</h2>
            <p className="text-sm text-[#fdfbf7]/60 max-w-md leading-relaxed mb-8">
              Real usage analytics and provider health telemetry will be available once PostHog and usage-event ingestion are wired in Phase 6.
            </p>
            <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
              Set POSTHOG_KEY and enable usage event collection to activate analytics.
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Real analytics UI will be implemented in Phase 6 */}
            <p className="text-sm text-[#fdfbf7]/60">Analytics are configured but the visualization components are being built.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;