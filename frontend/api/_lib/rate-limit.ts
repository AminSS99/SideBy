/**
 * SideBy Rate Limiter
 * Redis-backed fixed-window rate limiting + daily usage caps.
 * Subscription-aware plan limits with free-plan daily usage caps.
 */
import { redisGet, redisIncrement, getRuntimeStoreKind } from "./redis.js";
import { logger } from "./log.js";
import { resolveSubscriptionState } from "./subscription.js";
import type { BillingPlan } from "./subscription.js";
import { configuredQuota, dailyLimitFor, monthlyLimitFor } from "./plan-limits.js";

export { configuredQuota };

export function getGlobalComparisonsDailyCap(): number {
  return configuredQuota("GLOBAL_COMPARISONS_PER_DAY", 1500);
}

export function getGlobalWebSearchesDailyCap(): number {
  return configuredQuota("GLOBAL_WEB_SEARCHES_PER_DAY", 1000);
}

const runtimeStore = getRuntimeStoreKind();
if (runtimeStore === "none") {
  logger.warn("Runtime store not configured. Rate limits are unavailable. Set REDIS_URL/REDIS_TOKEN or DATABASE_URL.");
} else if (runtimeStore === "postgres") {
  logger.warn("Redis not configured. Using Postgres runtime fallback for rate limits.");
}

// ─── Free Plan Limits (env-overridable) ─────────────────────────────────────

export const FREE_LIMITS = {
  comparisonsPerDay: configuredQuota("FREE_COMPARISONS_PER_DAY", 5),
  followUpsPerDay: configuredQuota("FREE_FOLLOWUPS_PER_DAY", 10),
  refreshesPerDay: configuredQuota("FREE_REFRESHES_PER_DAY", 3),
  exportsPerDay: configuredQuota("FREE_EXPORTS_PER_DAY", 10),
  watchlistsPerDay: configuredQuota("FREE_WATCHLISTS_PER_DAY", 5),
  chatPerDay: configuredQuota("FREE_CHAT_PER_DAY", 50),
  contextImportsPerDay: configuredQuota("FREE_CONTEXT_IMPORTS_PER_DAY", 10),
  webSearchesPerDay: configuredQuota("FREE_WEB_SEARCHES_PER_DAY", 2),
};

// ─── Rate Limit Types ───────────────────────────────────────────────────────

export type RateLimitAction =
  | "comparison"
  | "followUp"
  | "refresh"
  | "export"
  | "watchlist"
  | "chat"
  | "contextImport"
  | "webSearch";

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp
  window: string;
}

// Explicit mapping: grammatical pluralization is not a safe quota lookup.
const ACTION_LIMITS: Record<RateLimitAction, number> = {
  comparison: FREE_LIMITS.comparisonsPerDay,
  followUp: FREE_LIMITS.followUpsPerDay,
  refresh: FREE_LIMITS.refreshesPerDay,
  export: FREE_LIMITS.exportsPerDay,
  watchlist: FREE_LIMITS.watchlistsPerDay,
  chat: FREE_LIMITS.chatPerDay,
  contextImport: FREE_LIMITS.contextImportsPerDay,
  webSearch: FREE_LIMITS.webSearchesPerDay,
};

async function getEffectiveBillingPlan(
  userId: string | null,
  orgId: string | null,
  action: RateLimitAction,
): Promise<BillingPlan> {
  if (!userId && !orgId) return "free";

  try {
    const subscription = await resolveSubscriptionState({ userId, orgId, feature: action === "contextImport" ? "knowledgeUpload" : action === "webSearch" ? "comparison" : action });
    return subscription.plan;
  } catch (error) {
    logger.warn("Unable to resolve billing plan; falling back to free limits", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "free";
  }
}

function unlimitedResult(): RateLimitResult {
  return {
    allowed: true,
    limit: Number.MAX_SAFE_INTEGER,
    remaining: Number.MAX_SAFE_INTEGER,
    resetAt: Date.now() + 86400000,
    window: "plan",
  };
}

// ─── Daily Usage Caps ───────────────────────────────────────────────────────

function dailyKey(keyType: string, keyValue: string, action: RateLimitAction): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `usage:${keyType}:${keyValue}:${action}:${today}`;
}

export async function checkUsageLimit(
  keyType: "user" | "ip" | "org",
  keyValue: string,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  const limit = ACTION_LIMITS[action];
  const key = dailyKey(keyType, keyValue, action);

  const current = (await redisGet<number>(key)) || 0;
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  const resetAt = tomorrow.getTime();

  if (current >= limit) {
    logger.warn("Usage limit exceeded", { keyType, keyValue, action, current, limit });
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      window: "daily",
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - current,
    resetAt,
    window: "daily",
  };
}

export async function checkAndRecordUsage(
  keyType: "user" | "ip" | "org",
  keyValue: string,
  action: RateLimitAction,
  limit = ACTION_LIMITS[action],
): Promise<RateLimitResult> {
  const key = dailyKey(keyType, keyValue, action);
  const ttl = getSecondsUntilMidnightUTC();

  const newCount = await redisIncrement(key, 1, ttl);
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  const resetAt = tomorrow.getTime();

  if (newCount > limit) {
    logger.warn("Usage limit exceeded", { keyType, keyValue, action, current: newCount, limit });
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      window: "daily",
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - newCount,
    resetAt,
    window: "daily",
  };
}

export async function incrementUsage(
  keyType: "user" | "ip" | "org",
  keyValue: string,
  action: RateLimitAction,
  quantity = 1,
): Promise<void> {
  const key = dailyKey(keyType, keyValue, action);
  const ttl = getSecondsUntilMidnightUTC();
  await redisIncrement(key, quantity, ttl);
}

/** Gives back one reserved daily slot (e.g. when our provider failed before delivering anything). */
export async function refundUsage(
  keyType: "user" | "ip" | "org",
  keyValue: string,
  action: RateLimitAction,
): Promise<void> {
  try {
    await incrementUsage(keyType, keyValue, action, -1);
  } catch (error) {
    logger.warn("Unable to refund usage", { action, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function getUsageStatus(
  keyType: "user" | "ip" | "org",
  keyValue: string,
  plan: BillingPlan = "free",
): Promise<Record<RateLimitAction, { used: number; limit: number; remaining: number }>> {
  const actions: RateLimitAction[] = ["comparison", "followUp", "refresh", "export", "watchlist", "chat", "contextImport", "webSearch"];
  const status = {} as Record<RateLimitAction, { used: number; limit: number; remaining: number }>;

  for (const action of actions) {
    const limit = dailyLimitFor(plan, action);
    const key = dailyKey(keyType, keyValue, action);
    const used = (await redisGet<number>(key)) || 0;
    status[action] = { used, limit, remaining: Math.max(0, limit - used) };
  }

  return status;
}

// ─── Monthly caps (expensive actions on paid tiers) ──────────────────────────

function monthKey(userId: string, action: RateLimitAction): string {
  return `usage:user:${userId}:${action}:month:${new Date().toISOString().slice(0, 7)}`;
}

function nextMonthStartUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
}

export async function checkAndRecordMonthlyUsage(
  userId: string,
  action: RateLimitAction,
  limit: number,
): Promise<RateLimitResult> {
  const resetAt = nextMonthStartUTC();
  const ttl = Math.max(60, Math.ceil((resetAt - Date.now()) / 1000));
  const count = await redisIncrement(monthKey(userId, action), 1, ttl);
  if (count > limit) {
    logger.warn("Monthly usage limit exceeded", { userId, action, current: count, limit });
    return { allowed: false, limit, remaining: 0, resetAt, window: "monthly" };
  }
  return { allowed: true, limit, remaining: limit - count, resetAt, window: "monthly" };
}

export async function getMonthlyUsageStatus(
  userId: string,
  plan: BillingPlan,
): Promise<Partial<Record<"comparison" | "webSearch", { used: number; limit: number; remaining: number }>>> {
  const out: Partial<Record<"comparison" | "webSearch", { used: number; limit: number; remaining: number }>> = {};
  for (const action of ["comparison", "webSearch"] as const) {
    const limit = monthlyLimitFor(plan, action);
    if (limit === null) continue;
    const used = (await redisGet<number>(monthKey(userId, action))) || 0;
    out[action] = { used, limit, remaining: Math.max(0, limit - used) };
  }
  return out;
}

// ─── Fixed Window Rate Limits (per-minute burst protection) ─────────────────

export async function checkRateLimit(
  keyType: "user" | "ip",
  keyValue: string,
  action: string,
  maxPerMinute: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 60) * 60;
  const key = `rate:${keyType}:${keyValue}:${action}:${windowStart}`;

  // Admit against the atomic increment result; separate GET/INCR races under load.
  const current = await redisIncrement(key, 1, 60);

  if (current > maxPerMinute) {
    return {
      allowed: false,
      limit: maxPerMinute,
      remaining: 0,
      resetAt: (windowStart + 60) * 1000,
      window: "1m",
    };
  }

  return {
    allowed: true,
    limit: maxPerMinute,
    remaining: maxPerMinute - current,
    resetAt: (windowStart + 60) * 1000,
    window: "1m",
  };
}

// ─── Combined Check for API Routes ──────────────────────────────────────────

export async function checkRouteLimit(
  userId: string | null,
  ip: string | null,
  action: RateLimitAction,
  orgId: string | null = null,
): Promise<RateLimitResult> {
  const plan = await getEffectiveBillingPlan(userId, orgId, action);
  if (plan !== "free") {
    // Paid tiers are finite too: burst guard, then a per-tier daily cap and,
    // for expensive actions, a monthly cap. Slots are reserved up front.
    if (!userId) return { allowed: false, limit: 0, remaining: 0, resetAt: Date.now() + 60000, window: "1m" };
    const burst = await checkRateLimit("user", userId, action, 60);
    if (!burst.allowed) return burst;

    const daily = await checkAndRecordUsage("user", userId, action, dailyLimitFor(plan, action));
    if (!daily.allowed) return daily;

    const monthlyCap = monthlyLimitFor(plan, action);
    if (monthlyCap !== null) {
      const monthly = await checkAndRecordMonthlyUsage(userId, action, monthlyCap);
      if (!monthly.allowed) {
        await incrementUsage("user", userId, action, -1);
        return monthly;
      }
    }
    return daily;
  }

  // Check user limit first (if authenticated)
  if (userId) {
    // Also check burst rate limit
    const burstLimit = await checkRateLimit("user", userId, action, 10);
    if (!burstLimit.allowed) return burstLimit;

    // Reserve before starting work, so simultaneous jobs cannot overspend the cap.
    return checkAndRecordUsage("user", userId, action);
  }

  // Anonymous: check IP limit
  if (ip) {
    const burstLimit = await checkRateLimit("ip", ip, action, 5);
    if (!burstLimit.allowed) return burstLimit;

    return checkAndRecordUsage("ip", ip, action, Math.floor(ACTION_LIMITS[action] / 2));
  }

  // No identity at all — block
  return {
    allowed: false,
    limit: 0,
    remaining: 0,
    resetAt: Date.now() + 86400000,
    window: "daily",
  };
}

export async function recordUsage(
  userId: string | null,
  ip: string | null,
  action: RateLimitAction,
): Promise<void> {
  if (userId) {
    await incrementUsage("user", userId, action);
  } else if (ip) {
    await incrementUsage("ip", ip, action);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

export function formatLimitError(result: RateLimitResult): string {
  if (!result.allowed) {
    if (result.window === "1m") {
      const seconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      return `Too many requests. Try again in ${seconds} seconds.`;
    }
    if (result.window === "monthly") {
      const days = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 86400000));
      return `Monthly limit reached (${result.limit}/${result.limit}). Resets in ${days} day${days === 1 ? "" : "s"}.`;
    }
    const resetDate = new Date(result.resetAt);
    const hours = Math.ceil((result.resetAt - Date.now()) / 3600000);
    return `Daily limit reached (${result.limit}/${result.limit}). Resets in ${hours}h (${resetDate.toLocaleTimeString()}).`;
  }
  return "";
}

// ─── Global Circuit Breakers (per UTC day spend bounds) ─────────────────────

export interface GlobalDailyBudgetResult {
  allowed: boolean;
  resetAt: number;
}

export async function checkGlobalDailyBudget(
  name: string,
  cap: number,
): Promise<GlobalDailyBudgetResult> {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  const resetAt = tomorrow.getTime();

  if (cap <= 0) {
    logger.warn("Global daily budget exhausted (cap <= 0)", { name, cap });
    return { allowed: false, resetAt };
  }

  const today = new Date().toISOString().slice(0, 10);
  const key = `usage:global:${name}:${today}`;
  const ttl = Math.max(1, getSecondsUntilMidnightUTC());

  try {
    const current = await redisIncrement(key, 1, ttl);
    if (current > cap) {
      logger.warn("Global daily budget exceeded", { name, current, cap });
      return { allowed: false, resetAt };
    }
    return { allowed: true, resetAt };
  } catch (error) {
    logger.warn("Global daily budget store unavailable; blocking new work", {
      name,
      cap,
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: false, resetAt: Date.now() + 60000 };
  }
}
