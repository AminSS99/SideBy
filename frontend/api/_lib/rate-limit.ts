/**
 * SideBy Rate Limiter
 * Redis-backed fixed-window rate limiting + daily usage caps.
 * Subscription-aware plan limits with free-plan daily usage caps.
 */
import { redisGet, redisIncrement, getRuntimeStoreKind } from "./redis.js";
import { logger } from "./log.js";
import { resolveSubscriptionState } from "./subscription.js";
import type { BillingPlan } from "./subscription.js";

const runtimeStore = getRuntimeStoreKind();
if (runtimeStore === "none") {
  logger.warn("Runtime store not configured. Rate limits are unavailable. Set REDIS_URL/REDIS_TOKEN or DATABASE_URL.");
} else if (runtimeStore === "postgres") {
  logger.warn("Redis not configured. Using Postgres runtime fallback for rate limits.");
}

// ─── Free Plan Limits (env-overridable) ─────────────────────────────────────

function configuredQuota(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

const FREE_LIMITS = {
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
): Promise<Record<RateLimitAction, { used: number; limit: number; remaining: number }>> {
  const actions: RateLimitAction[] = ["comparison", "followUp", "refresh", "export", "watchlist", "chat", "contextImport", "webSearch"];
  const status = {} as Record<RateLimitAction, { used: number; limit: number; remaining: number }>;

  for (const action of actions) {
    const limit = ACTION_LIMITS[action];
    const key = dailyKey(keyType, keyValue, action);
    const used = (await redisGet<number>(key)) || 0;
    status[action] = { used, limit, remaining: Math.max(0, limit - used) };
  }

  return status;
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
    const burst = userId
      ? await checkRateLimit("user", userId, action, 60)
      : ip
        ? await checkRateLimit("ip", ip, action, 30)
        : null;
    if (burst && !burst.allowed) return burst;
    if (!burst) return { allowed: false, limit: 0, remaining: 0, resetAt: Date.now() + 60000, window: "1m" };
    await recordUsage(userId, ip, action);
    return unlimitedResult();
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
    const resetDate = new Date(result.resetAt);
    const hours = Math.ceil((result.resetAt - Date.now()) / 3600000);
    return `Daily limit reached (${result.limit}/${result.limit}). Resets in ${hours}h (${resetDate.toLocaleTimeString()}).`;
  }
  return "";
}
