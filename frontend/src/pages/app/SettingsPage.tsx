import React, { useRef } from "react";
import { envConfig } from "@/config/env";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const settingsRows = [
  {
    label: "Clerk publishable key",
    value: envConfig.clerkPublishableKey ? "Configured" : "Not configured",
    status: envConfig.clerkPublishableKey ? "good" : "bad"
  },
  {
    label: "Research API",
    value: envConfig.apiBaseUrl || "Same origin",
    status: "good"
  },
  {
    label: "Pexels API",
    value: envConfig.hasPexelsApiKey ? "Configured" : "Not configured",
    status: envConfig.hasPexelsApiKey ? "good" : "neutral"
  },
];

const SettingsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".set-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".set-card", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".set-row", { x: -20, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }, "-=0.4");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8 max-w-4xl">
      <div className="set-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Settings
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Foundation config
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/60">
          This page exposes the environment-dependent configuration that the SaaS modules rely on for external integrations.
        </p>
      </div>

      <div className="set-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <h2 className="mb-6 font-serif text-2xl text-[#fdfbf7] border-b border-[#2a2a2a] pb-6">Environment Variables</h2>
        <div className="space-y-2">
          {settingsRows.map((row) => (
            <div
              key={row.label}
              className="set-row flex flex-col justify-between gap-4 border border-[#2a2a2a] bg-[#0c0b0a] p-4 rounded-sm sm:flex-row sm:items-center"
            >
              <span className="text-sm font-medium text-[#fdfbf7]">{row.label}</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  row.status === "good" ? "text-emerald-500" :
                  row.status === "bad" ? "text-amber-500" :
                  "text-[#fdfbf7]/40"
                }`}>
                  {row.value}
                </span>
                <span className={`h-2 w-2 rounded-full ${
                  row.status === "good" ? "bg-emerald-500" :
                  row.status === "bad" ? "bg-amber-500" :
                  "bg-[#444]"
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;