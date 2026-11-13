import { configuredQuota } from "./plan-limits.js";

/** Invalid deployment settings must never turn paid-work limits into NaN/Infinity. */
export function getJobLimits() {
  const cost = Number(process.env.MAX_JOB_COST_USD ?? "0.50");
  return {
    maxCostUsd: Number.isFinite(cost) && cost >= 0 ? cost : 0.5,
    maxTimeMs: configuredQuota("MAX_JOB_TIME_MS", 300_000),
    maxSearchCalls: configuredQuota("MAX_SEARCH_CALLS", 12),
    maxAiCalls: configuredQuota("MAX_AI_CALLS", 6),
  };
}
