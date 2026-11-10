/**
 * Single source of truth for per-tier usage. Every paid tier is finite: a
 * SnapSolve subscription is shared across several products, so no tier may
 * assume SideBy is its only cost. Daily caps reset at 00:00 UTC; monthly caps
 * (expensive actions only) reset on the 1st (UTC).
 *
 * Tiers: free = Flow, pro = Pulse ($9), team = Core ($19), business = Orbit ($39).
 */
import type { BillingPlan } from "./subscription.js";

export type PlanAction =
  | "comparison"
  | "followUp"
  | "refresh"
  | "export"
  | "watchlist"
  | "chat"
  | "contextImport"
  | "webSearch";

export type MonthlyAction = "comparison" | "webSearch";

type DailyTable = Record<PlanAction, number>;

export function configuredQuota(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

/** Flow (free) stays env-tunable, exactly as before. */
function freeDaily(): DailyTable {
  return {
    comparison: configuredQuota("FREE_COMPARISONS_PER_DAY", 5),
    followUp: configuredQuota("FREE_FOLLOWUPS_PER_DAY", 10),
    refresh: configuredQuota("FREE_REFRESHES_PER_DAY", 3),
    export: configuredQuota("FREE_EXPORTS_PER_DAY", 10),
    watchlist: configuredQuota("FREE_WATCHLISTS_PER_DAY", 5),
    chat: configuredQuota("FREE_CHAT_PER_DAY", 50),
    contextImport: configuredQuota("FREE_CONTEXT_IMPORTS_PER_DAY", 10),
    webSearch: configuredQuota("FREE_WEB_SEARCHES_PER_DAY", 2),
  };
}

const PAID_DAILY: Record<Exclude<BillingPlan, "free">, DailyTable> = {
  // Pulse: $9 for the whole ecosystem.
  pro: { comparison: 10, followUp: 30, refresh: 10, export: 20, watchlist: 10, chat: 100, contextImport: 20, webSearch: 10 },
  // Core: $19.
  team: { comparison: 25, followUp: 80, refresh: 25, export: 50, watchlist: 25, chat: 250, contextImport: 50, webSearch: 25 },
  // Orbit: $39, the highest tier.
  business: { comparison: 60, followUp: 200, refresh: 60, export: 120, watchlist: 60, chat: 600, contextImport: 120, webSearch: 60 },
};

const PAID_MONTHLY: Record<Exclude<BillingPlan, "free">, Record<MonthlyAction, number>> = {
  pro: { comparison: 100, webSearch: 100 },
  team: { comparison: 300, webSearch: 300 },
  business: { comparison: 800, webSearch: 800 },
};

export function dailyLimitsFor(plan: BillingPlan): DailyTable {
  return plan === "free" ? freeDaily() : PAID_DAILY[plan] ?? freeDaily();
}

export function dailyLimitFor(plan: BillingPlan, action: PlanAction): number {
  return dailyLimitsFor(plan)[action];
}

/** Monthly cap for an expensive action, or null when the tier has none (Flow is bounded by its daily cap). */
export function monthlyLimitFor(plan: BillingPlan, action: PlanAction): number | null {
  if (plan === "free") return null;
  if (action !== "comparison" && action !== "webSearch") return null;
  return PAID_MONTHLY[plan]?.[action] ?? null;
}
