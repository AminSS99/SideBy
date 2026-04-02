import React from "react";
import { envConfig } from "@/config/env";

const settingsRows = [
  {
    label: "Supabase URL",
    value: envConfig.supabaseUrl || "Not configured",
  },
  {
    label: "Publishable key",
    value: envConfig.supabasePublishableKey ? "Configured" : "Not configured",
  },
  {
    label: "Backend API",
    value: envConfig.apiBaseUrl || "Not configured",
  },
];

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Foundation configuration
        </h1>
        <p className="mt-4 max-w-3xl text-white/60">
          This page exposes the environment-dependent configuration that the next SaaS phases rely on.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
        <div className="space-y-4">
          {settingsRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col justify-between gap-2 border-b border-white/8 pb-4 last:border-b-0 last:pb-0 md:flex-row"
            >
              <span className="text-sm font-semibold text-white">{row.label}</span>
              <span className="text-sm text-white/55">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
