import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ counts: new Map<string, number>(), plan: "free", throwOnIncr: false }));
vi.mock("../redis.js", () => ({
  getRuntimeStoreKind: () => "redis",
  redisGet: async (key: string) => state.counts.get(key) ?? null,
  redisIncrement: async (key: string, amount = 1) => {
    if (state.throwOnIncr) {
      throw new Error("Redis connection timed out");
    }
    const next = (state.counts.get(key) ?? 0) + amount;
    state.counts.set(key, next);
    return next;
  },
}));
vi.mock("../subscription.js", () => ({
  resolveSubscriptionState: async () => ({ plan: state.plan }),
}));
vi.mock("../log.js", () => ({ logger: { warn: vi.fn() } }));

import {
  checkAndRecordUsage,
  checkGlobalDailyBudget,
  checkRateLimit,
  checkRouteLimit,
  getGlobalComparisonsDailyCap,
  getGlobalWebSearchesDailyCap,
  getUsageStatus,
  refundUsage,
} from "../rate-limit.js";

describe("request admission limits", () => {
  beforeEach(() => { state.counts.clear(); state.plan = "free"; state.throwOnIncr = false; });

  it.each([["refresh", 3], ["chat", 50]] as const)("enforces the %s quota", async (action, limit) => {
    for (let i = 0; i < limit; i++) {
      expect((await checkAndRecordUsage("user", "u1", action)).allowed).toBe(true);
    }
    expect(await checkAndRecordUsage("user", "u1", action)).toMatchObject({ allowed: false, limit, remaining: 0 });
    expect((await getUsageStatus("user", "u1"))[action].limit).toBe(limit);
  });

  it("admits only the burst budget during a concurrent request wave", async () => {
    const results = await Promise.all(Array.from({ length: 100 }, () => checkRateLimit("ip", "1.2.3.4", "validate", 12)));
    expect(results.filter((result) => result.allowed)).toHaveLength(12);
    expect(results.every((result) => result.remaining >= 0)).toBe(true);
  });

  it("reserves the daily budget before concurrent expensive handlers start", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => checkRouteLimit("u1", null, "comparison")));
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
    expect((await getUsageStatus("user", "u1")).comparison.remaining).toBe(0);
  });

  it("enforces the reduced anonymous daily budget", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => checkRouteLimit(null, "1.2.3.4", "comparison")));
    expect(results.filter((result) => result.allowed)).toHaveLength(2);
  });

  it.each([
    ["pro", 10],
    ["team", 25],
    ["business", 60],
  ] as const)("caps the %s tier at %i comparisons per day", async (plan, cap) => {
    state.plan = plan;
    let allowed = 0;
    for (let i = 0; i < cap + 5; i++) {
      // Fresh minute-window per call keeps this test about the daily cap, not the burst guard.
      state.counts.forEach((_v, key) => { if (key.startsWith("rate:")) state.counts.delete(key); });
      if ((await checkRouteLimit("paid-user", null, "comparison")).allowed) allowed++;
    }
    expect(allowed).toBe(cap);
  });

  it("every paid tier is finite and strictly ordered Pulse < Core < Orbit for each action", async () => {
    const { dailyLimitsFor } = await import("../plan-limits.js");
    for (const action of Object.keys(dailyLimitsFor("pro")) as Array<keyof ReturnType<typeof dailyLimitsFor>>) {
      const [free, pro, team, business] = (["free", "pro", "team", "business"] as const).map((p) => dailyLimitsFor(p)[action]);
      expect(Number.isFinite(business)).toBe(true);
      expect(pro).toBeGreaterThan(free);
      expect(team).toBeGreaterThan(pro);
      expect(business).toBeGreaterThan(team);
    }
  });

  it("enforces the monthly comparison cap and gives the daily slot back when it trips", async () => {
    state.plan = "pro";
    const { monthlyLimitFor } = await import("../plan-limits.js");
    expect(monthlyLimitFor("pro", "comparison")).toBe(100);
    const month = new Date().toISOString().slice(0, 7);
    state.counts.set(`usage:user:capped:comparison:month:${month}`, 100);
    const result = await checkRouteLimit("capped", null, "comparison");
    expect(result).toMatchObject({ allowed: false, window: "monthly", limit: 100 });
    const today = new Date().toISOString().slice(0, 10);
    expect(state.counts.get(`usage:user:capped:comparison:${today}`)).toBe(0);
    const { formatLimitError } = await import("../rate-limit.js");
    expect(formatLimitError(result)).toMatch(/Monthly limit reached/);
  });

  it("explains burst exhaustion as a short wait", async () => {
    const { formatLimitError } = await import("../rate-limit.js");
    expect(formatLimitError({ allowed: false, limit: 10, remaining: 0, window: "1m", resetAt: Date.now() + 30000 })).toMatch(/30 seconds/);
  });

  it.each(["invalid", "Infinity", "-1", "1.5"])("falls back safely for an invalid quota setting: %s", async (value) => {
    vi.stubEnv("FREE_COMPARISONS_PER_DAY", value);
    vi.resetModules();
    try {
      const limiter = await import("../rate-limit.js");
      for (let i = 0; i < 5; i++) await limiter.checkAndRecordUsage("user", "config-user", "comparison");
      expect(await limiter.checkAndRecordUsage("user", "config-user", "comparison")).toMatchObject({ allowed: false, limit: 5 });
    } finally { vi.unstubAllEnvs(); }
  });

  describe("checkGlobalDailyBudget", () => {
    it("allows requests under the global cap and blocks once the cap is exceeded", async () => {
      const cap = 3;
      for (let i = 0; i < cap; i++) {
        const result = await checkGlobalDailyBudget("test-budget", cap);
        expect(result.allowed).toBe(true);
        expect(result.resetAt).toBeGreaterThan(Date.now());
      }

      // Next request exceeds cap
      const blocked = await checkGlobalDailyBudget("test-budget", cap);
      expect(blocked.allowed).toBe(false);
      expect(blocked.resetAt).toBeGreaterThan(Date.now());
    });

    it("blocks immediately if cap is zero or negative", async () => {
      const zero = await checkGlobalDailyBudget("zero-cap", 0);
      expect(zero.allowed).toBe(false);
      expect(zero.resetAt).toBeGreaterThan(Date.now());

      const negative = await checkGlobalDailyBudget("neg-cap", -10);
      expect(negative.allowed).toBe(false);
      expect(negative.resetAt).toBeGreaterThan(Date.now());
    });

    it("blocks new paid work when the counter store throws", async () => {
      state.throwOnIncr = true;
      const result = await checkGlobalDailyBudget("failing-store", 100);
      expect(result.allowed).toBe(false);
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60000);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("defaults to 1500 for comparisons and 1000 for web searches, respecting env overrides", () => {
      expect(getGlobalComparisonsDailyCap()).toBe(1500);
      expect(getGlobalWebSearchesDailyCap()).toBe(1000);

      vi.stubEnv("GLOBAL_COMPARISONS_PER_DAY", "2500");
      vi.stubEnv("GLOBAL_WEB_SEARCHES_PER_DAY", "500");
      try {
        expect(getGlobalComparisonsDailyCap()).toBe(2500);
        expect(getGlobalWebSearchesDailyCap()).toBe(500);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("refunds reserved user quota when global breaker rejects", async () => {
      // User reserves 1 daily slot
      const initial = await checkAndRecordUsage("user", "u-refund-test", "comparison");
      expect(initial.allowed).toBe(true);
      expect((await getUsageStatus("user", "u-refund-test")).comparison.used).toBe(1);

      // Global breaker blocks and refunds
      await refundUsage("user", "u-refund-test", "comparison");
      expect((await getUsageStatus("user", "u-refund-test")).comparison.used).toBe(0);
    });
  });
});
