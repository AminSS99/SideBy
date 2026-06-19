/**
 * SideBy Rate Limiter
 * Redis-backed sliding window rate limiting + daily usage caps.
 * No Paddle. Everyone is on the free plan with hard daily limits.
 */
import { redisGet, redisSet, redisIncrement, getRedis } from "./redis.js";
import { logger } from "./log.js";
import { resolveSubscriptionState } from "./subscription.js";
import type { BillingPlan } from "./subscription.js";

// Warn once if Redis is not configured — rate limits will not be enforced
const redisAvailable = !!getRedis();
if (!redisAvailable) {
  logger.warn("Redis not configured. Rate limits are DISABLED. Set REDIS_URL and REDIS_TOKEN to enable usage caps.");
}

// ─── Free Plan Limits (env-overridable) ─────────────────────────────────────

const FREE_LIMITS = {
  comparisonsPerDay: Number(process.env.FREE_COMPARISONS_PER_DAY || "5"),
  followUpsPerDay: Number(process.env.FREE_FOLLOWUPS_PER_DAY || "10"),
  refreshesPerDay: Number(process.env.FREE_REFRESHES_PER_DAY || "3"),
  exportsPerDay: Number(process.env.FREE_EXPORTS_PER_DAY || "10"),
  watchlistsPerDay: Number(process.env.FREE_WATCHLISTS_PER_DAY || "5"),
};

// ─── Rate Limit Types ───────────────────────────────────────────────────────

export type RateLimitAction =
  | "comparison"
  | "followUp"
  | "refresh"
  | "export"
  | "watchlist";

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp
  window: string;
}

async function getEffectiveBillingPlan(
  userId: string | null,
  orgId: string | null,
  action: RateLimitAction,
): Promise<BillingPlan> {
  if (!userId && !orgId) return "free";

  try {
    const subscription = await resolveSubscriptionState({ userId, orgId, feature: action });
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
  const limit = FREE_LIMITS[`${action}sPerDay` as keyof typeof FREE_LIMITS];
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

export async function getUsageStatus(
  keyType: "user" | "ip" | "org",
  keyValue: string,
): Promise<Record<RateLimitAction, { used: number; limit: number; remaining: number }>> {
  const actions: RateLimitAction[] = ["comparison", "followUp", "refresh", "export", "watchlist"];
  const status = {} as Record<RateLimitAction, { used: number; limit: number; remaining: number }>;

  for (const action of actions) {
    const limit = FREE_LIMITS[`${action}sPerDay` as keyof typeof FREE_LIMITS];
    const key = dailyKey(keyType, keyValue, action);
    const used = (await redisGet<number>(key)) || 0;
    status[action] = { used, limit, remaining: Math.max(0, limit - used) };
  }

  return status;
}

// ─── Sliding Window Rate Limits (per-minute burst protection) ───────────────

export async function checkRateLimit(
  keyType: "user" | "ip",
  keyValue: string,
  action: string,
  maxPerMinute: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 60) * 60;
  const key = `rate:${keyType}:${keyValue}:${action}:${windowStart}`;

  const current = (await redisGet<number>(key)) || 0;

  if (current >= maxPerMinute) {
    return {
      allowed: false,
      limit: maxPerMinute,
      remaining: 0,
      resetAt: (windowStart + 60) * 1000,
      window: "1m",
    };
  }

  await redisIncrement(key, 1, 60);

  return {
    allowed: true,
    limit: maxPerMinute,
    remaining: maxPerMinute - current - 1,
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
    return unlimitedResult();
  }

  // Check user limit first (if authenticated)
  if (userId) {
    const userLimit = await checkUsageLimit("user", userId, action);
    if (!userLimit.allowed) return userLimit;

    // Also check burst rate limit
    const burstLimit = await checkRateLimit("user", userId, action, 10);
    if (!burstLimit.allowed) return burstLimit;

    return userLimit;
  }

  // Anonymous: check IP limit
  if (ip) {
    const ipLimit = await checkUsageLimit("ip", ip, action);
    if (!ipLimit.allowed) {
      // Anonymous gets stricter limits
      return { ...ipLimit, limit: Math.floor(ipLimit.limit / 2) };
    }

    const burstLimit = await checkRateLimit("ip", ip, action, 5);
    if (!burstLimit.allowed) return burstLimit;

    return ipLimit;
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
    const resetDate = new Date(result.resetAt);
    const hours = Math.ceil((result.resetAt - Date.now()) / 3600000);
    return `Daily limit reached (${result.limit}/${result.limit}). Resets in ${hours}h (${resetDate.toLocaleTimeString()}).`;
  }
  return "";
}
