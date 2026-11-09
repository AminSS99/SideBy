import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuth = vi.fn();
const checkRouteLimit = vi.fn();
const searchTavily = vi.fn();
const refundUsage = vi.fn();
const checkGlobalDailyBudget = vi.fn();
const getGlobalWebSearchesDailyCap = vi.fn(() => 1000);

vi.mock("../_lib/auth.js", () => ({ requireAuth }));
vi.mock("../_lib/redis.js", () => ({ assertRedisAvailable: vi.fn(async () => undefined) }));
vi.mock("../_lib/rate-limit.js", () => ({
  checkRouteLimit,
  formatLimitError: () => "Daily limit reached.",
  refundUsage,
  checkGlobalDailyBudget,
  getGlobalWebSearchesDailyCap,
}));
vi.mock("../_lib/search.js", () => ({ searchTavily }));

const makeResponse = () => {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers,
    setHeader: (k: string, v: string) => { headers[k] = v; },
    hasHeader: (k: string) => k in headers,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res;
};

const call = async (body: unknown, method = "POST") => {
  const { default: handler } = await import("./web-search.js");
  const res = makeResponse();
  await handler({ method, body, headers: {} } as never, res as never);
  return res;
};

describe("POST /api/web-search", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAuth.mockResolvedValue({ userId: "user_1", orgId: null });
    checkGlobalDailyBudget.mockResolvedValue({ allowed: true, resetAt: Date.now() + 86400000 });
    getGlobalWebSearchesDailyCap.mockReturnValue(1000);
  });

  it("rejects anonymous callers before touching quota or providers", async () => {
    requireAuth.mockRejectedValue(Object.assign(new Error("Authentication required"), { statusCode: 401 }));
    const res = await call({ query: "neon pricing" });
    expect(res.statusCode).toBe(401);
    expect(checkRouteLimit).not.toHaveBeenCalled();
    expect(searchTavily).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After once the free daily cap is spent, without searching", async () => {
    checkRouteLimit.mockResolvedValue({ allowed: false, limit: 2, remaining: 0, resetAt: Date.now() + 5000, window: "daily" });
    const res = await call({ query: "neon pricing" });
    expect(res.statusCode).toBe(429);
    expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
    expect(searchTavily).not.toHaveBeenCalled();
  });

  it("blocks at cap with 503 + Retry-After, refunds user quota, and skips provider call", async () => {
    checkRouteLimit.mockResolvedValue({ allowed: true, limit: 2, remaining: 1, resetAt: Date.now() + 5000, window: "daily" });
    const resetAt = Date.now() + 3600 * 1000;
    checkGlobalDailyBudget.mockResolvedValue({ allowed: false, resetAt });

    const res = await call({ query: "neon pricing" });
    expect(res.statusCode).toBe(503);
    expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
    expect(res.body).toEqual({
      error: "SideBy is at capacity right now. Please try again later.",
      code: "AT_CAPACITY",
    });
    expect(refundUsage).toHaveBeenCalledWith("user", "user_1", "webSearch");
    expect(searchTavily).not.toHaveBeenCalled();
  });

  it("returns trimmed http(s) results and the remaining quota when under cap", async () => {
    checkRouteLimit.mockResolvedValue({ allowed: true, limit: 2, remaining: 1, resetAt: Date.now() + 5000, window: "daily" });
    searchTavily.mockResolvedValue([
      { title: "Neon pricing", url: "https://neon.tech/pricing", content: "x".repeat(900), score: 1 },
      { title: "bad", url: "javascript:alert(1)", content: "nope", score: 0.5 },
    ]);
    const res = await call({ query: "neon pricing" });
    expect(res.statusCode).toBe(200);
    const body = res.body as { results: Array<{ url: string; snippet: string }>; usage: { remaining: number } };
    expect(body.results).toHaveLength(1);
    expect(body.results[0].snippet.length).toBe(400);
    expect(body.usage.remaining).toBe(1);
  });

  it("refunds the reserved slot when every provider fails", async () => {
    checkRouteLimit.mockResolvedValue({ allowed: true, limit: 2, remaining: 1, resetAt: Date.now() + 5000, window: "daily" });
    searchTavily.mockRejectedValue(new Error("All search providers failed."));
    const res = await call({ query: "neon pricing" });
    expect(res.statusCode).toBe(503);
    expect(refundUsage).toHaveBeenCalledWith("user", "user_1", "webSearch");
  });

  it("rejects too-short queries and non-POST methods", async () => {
    expect((await call({ query: "a" })).statusCode).toBe(400);
    expect((await call({ query: "neon pricing" }, "GET")).statusCode).toBe(405);
  });
});
