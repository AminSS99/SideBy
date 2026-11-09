import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const state = vi.hoisted(() => ({
  counts: new Map<string, number>(),
  userId: "user_1",
  orgId: null as string | null,
  plan: "free",
  throwOnGlobalIncr: false,
}));

const deps = vi.hoisted(() => ({
  createComparisonJob: vi.fn(async () => ({ id: "job_123", status: "queued" })),
}));

vi.mock("../../_lib/redis.js", () => ({
  getRuntimeStoreKind: () => "redis",
  assertRedisAvailable: vi.fn(async () => undefined),
  redisGet: async (key: string) => state.counts.get(key) ?? null,
  redisIncrement: async (key: string, amount = 1) => {
    if (state.throwOnGlobalIncr && key.startsWith("usage:global:")) {
      throw new Error("Redis counter store failure");
    }
    const next = (state.counts.get(key) ?? 0) + amount;
    state.counts.set(key, next);
    return next;
  },
}));

vi.mock("../../_lib/auth.js", () => ({
  requireAuth: async () => ({ userId: state.userId, orgId: state.orgId }),
  authenticateRequest: async () => ({ userId: state.userId, orgId: state.orgId }),
}));

vi.mock("../../_lib/api-key-auth.js", () => ({
  requireApiKey: async () => ({ userId: state.userId, orgId: state.orgId, scopes: ["comparisons:write"] }),
  assertApiKeyScope: vi.fn(),
}));

vi.mock("../../_lib/subscription.js", () => ({
  resolveSubscriptionState: async () => ({ plan: state.plan }),
}));

vi.mock("../../_lib/analytics.js", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("../../../src/lib/comparisonTaxonomy.js", () => ({
  analyzeComparisonQuery: () => ({ canStart: true, category: "software", status: "comparable" }),
  SUPPORTED_COMPARISON_CATEGORIES: [],
}));

vi.mock("../../_lib/secret-scan.js", () => ({
  assertNoLikelySecrets: vi.fn(),
}));

vi.mock("../../_lib/sideby.js", () => ({
  createComparisonJob: deps.createComparisonJob,
  listComparisonHistory: vi.fn(async () => []),
  sendJobError: (res: VercelResponse, err: unknown) => res.status(500).json({ error: String(err) }),
  sendJson: (res: VercelResponse, data: unknown, status = 200) => res.status(status).json(data),
}));

import comparisonHandler from "./index.js";
import v1ComparisonHandler from "../v1/comparisons/index.js";

const makeResponse = () => {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers,
    setHeader: (k: string, v: string) => { headers[k] = v; },
    hasHeader: (k: string) => k in headers,
    getHeader: (k: string) => headers[k],
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res;
};

const callComparison = async (body: unknown, method = "POST") => {
  const res = makeResponse();
  await comparisonHandler({ method, body, headers: {} } as VercelRequest, res as unknown as VercelResponse);
  return res;
};

const callV1Comparison = async (body: unknown, method = "POST") => {
  const res = makeResponse();
  await v1ComparisonHandler({ method, body, headers: {} } as VercelRequest, res as unknown as VercelResponse);
  return res;
};

describe("Global Circuit Breaker for Comparisons", () => {
  beforeEach(() => {
    state.counts.clear();
    state.userId = "user_1";
    state.orgId = null;
    state.plan = "free";
    state.throwOnGlobalIncr = false;
    vi.clearAllMocks();
    vi.stubEnv("GLOBAL_COMPARISONS_PER_DAY", "2");
  });

  describe("POST /api/comparisons", () => {
    it("allows requests under the global cap and charges per-user quota", async () => {
      const res = await callComparison({ query: "linear vs jira" });
      expect(res.statusCode).toBe(200);
      expect(deps.createComparisonJob).toHaveBeenCalledTimes(1);

      // Verify that user quota was charged 1 slot
      const today = new Date().toISOString().slice(0, 10);
      expect(state.counts.get(`usage:user:user_1:comparison:${today}`)).toBe(1);
      // Verify global breaker recorded 1 comparison
      expect(state.counts.get(`usage:global:comparisons:${today}`)).toBe(1);
    });

    it("blocks at cap with 503 + Retry-After and AT_CAPACITY JSON, without charging user quota", async () => {
      // Consume the global cap of 2
      await callComparison({ query: "item 1 vs item 2" });
      await callComparison({ query: "item 3 vs item 4" });
      expect(deps.createComparisonJob).toHaveBeenCalledTimes(2);

      const today = new Date().toISOString().slice(0, 10);
      expect(state.counts.get(`usage:global:comparisons:${today}`)).toBe(2);

      // Now switch to user_2 who has full per-user quota remaining
      state.userId = "user_2";
      const res = await callComparison({ query: "item 5 vs item 6" });

      expect(res.statusCode).toBe(503);
      expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
      expect(res.body).toEqual({
        error: "SideBy is at capacity right now. Please try again later.",
        code: "AT_CAPACITY",
      });

      // Crucial: createComparisonJob must NOT be called for rejected request
      expect(deps.createComparisonJob).toHaveBeenCalledTimes(2);

      // Crucial: user_2's daily quota must NOT be consumed (refunded to 0)
      expect(state.counts.get(`usage:user:user_2:comparison:${today}`)).toBe(0);
    });

    it("subjects paid-plan users to the global cap and does not charge their quota", async () => {
      state.plan = "pro";
      // Fill the global cap of 2
      const today = new Date().toISOString().slice(0, 10);
      state.counts.set(`usage:global:comparisons:${today}`, 2);

      const res = await callComparison({ query: "item 1 vs item 2" });
      expect(res.statusCode).toBe(503);
      expect(res.body).toEqual({
        error: "SideBy is at capacity right now. Please try again later.",
        code: "AT_CAPACITY",
      });
      expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
      expect(deps.createComparisonJob).not.toHaveBeenCalled();
      // Paid user's recorded usage was refunded
      expect(state.counts.get(`usage:user:user_1:comparison:${today}`)).toBe(0);
    });

    it("fails open when the counter store throws in the global breaker check", async () => {
      state.throwOnGlobalIncr = true;

      const res = await callComparison({ query: "linear vs jira" });
      expect(res.statusCode).toBe(200);
      expect(deps.createComparisonJob).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/v1/comparisons", () => {
    it("allows API-key requests under the global cap", async () => {
      const res = await callV1Comparison({ query: "linear vs jira" });
      expect(res.statusCode).toBe(202);
      expect(deps.createComparisonJob).toHaveBeenCalledTimes(1);

      const today = new Date().toISOString().slice(0, 10);
      expect(state.counts.get(`usage:user:user_1:comparison:${today}`)).toBe(1);
      expect(state.counts.get(`usage:global:comparisons:${today}`)).toBe(1);
    });

    it("blocks API-key requests at cap with 503 + Retry-After and refunds user quota", async () => {
      const today = new Date().toISOString().slice(0, 10);
      state.counts.set(`usage:global:comparisons:${today}`, 2);

      state.userId = "api_user_2";
      const res = await callV1Comparison({ query: "item 1 vs item 2" });

      expect(res.statusCode).toBe(503);
      expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
      expect(res.body).toEqual({
        error: "SideBy is at capacity right now. Please try again later.",
        code: "AT_CAPACITY",
      });
      expect(deps.createComparisonJob).not.toHaveBeenCalled();
      // Quota refunded
      expect(state.counts.get(`usage:user:api_user_2:comparison:${today}`)).toBe(0);
    });

    it("fails open when the counter store throws in v1 route", async () => {
      state.throwOnGlobalIncr = true;

      const res = await callV1Comparison({ query: "linear vs jira" });
      expect(res.statusCode).toBe(202);
      expect(deps.createComparisonJob).toHaveBeenCalledTimes(1);
    });
  });
});
