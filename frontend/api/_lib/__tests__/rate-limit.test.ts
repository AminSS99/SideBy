import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ counts: new Map<string, number>(), plan: "free" }));
vi.mock("../redis.js", () => ({
  getRuntimeStoreKind: () => "redis",
  redisGet: async (key: string) => state.counts.get(key) ?? null,
  redisIncrement: async (key: string, amount = 1) => {
    const next = (state.counts.get(key) ?? 0) + amount;
    state.counts.set(key, next);
    return next;
  },
}));
vi.mock("../subscription.js", () => ({
  resolveSubscriptionState: async () => ({ plan: state.plan }),
}));
vi.mock("../log.js", () => ({ logger: { warn: vi.fn() } }));

import { checkAndRecordUsage, checkRateLimit, checkRouteLimit, getUsageStatus } from "../rate-limit.js";

describe("request admission limits", () => {
  beforeEach(() => { state.counts.clear(); state.plan = "free"; });

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

  it("keeps paid requests burst-limited without applying the free daily cap", async () => {
    state.plan = "pro";
    const results = await Promise.all(Array.from({ length: 65 }, () => checkRouteLimit("paid-user", null, "comparison")));
    expect(results.filter((result) => result.allowed)).toHaveLength(60);
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
});
