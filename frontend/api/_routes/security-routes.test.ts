import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function makeRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: unknown;
  const res = {
    headers,
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    hasHeader: (key: string) => key in headers,
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: unknown) => {
      body = payload;
      return res;
    },
    end: () => res,
  };
  return {
    res: res as unknown as VercelResponse,
    get status() {
      return statusCode;
    },
    get body() {
      return body;
    },
    headers,
  };
}

describe("Route-level security hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("POST /api/ecosystem/session ignores attacker-supplied email and uses DB email", async () => {
    const resolveSession = vi.fn().mockResolvedValue({ snapsolve_user_id: "ss_1" });
    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_attacker" }),
    }));
    vi.doMock("../_lib/snapsolve-core.js", () => ({
      resolveSnapSolveWorkspaceSession: resolveSession,
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [{ email: "real-attacker@example.com" }],
            }),
          }),
        }),
      }),
    }));

    const { default: handler } = await import("./ecosystem-session.js");
    const r = makeRes();
    await handler(
      {
        method: "POST",
        body: { email: "victim-paid-customer@enterprise.com" },
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(200);
    expect(resolveSession).toHaveBeenCalledWith({
      clerkUserId: "user_attacker",
      email: "real-attacker@example.com",
    });
  });

  it("GET/POST /api/comparisons/:id/notes denies non-members (even on public comparisons) and preserves 401 status", async () => {
    const canAccessComparisonAsMember = vi.fn().mockResolvedValue(false);
    const requireAuth = vi.fn().mockResolvedValue({ userId: "user_stranger" });

    vi.doMock("../_lib/auth.js", () => ({ requireAuth }));
    vi.doMock("../_lib/db-auth.js", () => ({
      canAccessComparisonAsMember,
      canMutateComparison: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({}),
    }));

    const { default: handler } = await import("./comparisons/[id]/notes.js");

    // Non-member GET blocked with 404
    const r1 = makeRes();
    await handler(
      { method: "GET", query: { id: "cmp_public" }, headers: {} } as unknown as VercelRequest,
      r1.res,
    );
    expect(r1.status).toBe(404);
    expect(canAccessComparisonAsMember).toHaveBeenCalledWith(expect.anything(), "user_stranger", "cmp_public");

    // Unauthenticated request preserves 401 instead of returning 500
    requireAuth.mockRejectedValueOnce(Object.assign(new Error("Authentication required."), { statusCode: 401 }));
    const r2 = makeRes();
    await handler(
      { method: "POST", query: { id: "cmp_public" }, body: { body: "spam" }, headers: {} } as unknown as VercelRequest,
      r2.res,
    );
    expect(r2.status).toBe(401);
  });

  it("GET /api/comparisons/:id/diff validates version query params as positive integers", async () => {
    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
    }));
    vi.doMock("../_lib/db-auth.js", () => ({
      canAccessComparisonAsMember: vi.fn().mockResolvedValue(true),
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({}),
    }));

    const { default: handler } = await import("./comparisons/[id]/diff.js");
    const r = makeRes();
    await handler(
      {
        method: "GET",
        query: { id: "cmp_1", fromVersion: "not-a-number", toVersion: "2" },
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(400);
  });

  it("POST /api/comparisons/:id/translate enforces burst rate limit and global daily cap", async () => {
    const checkRateLimit = vi.fn().mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      window: "1m",
    });
    const checkGlobalDailyBudget = vi.fn().mockResolvedValue({
      allowed: false,
      resetAt: Date.now() + 3600_000,
    });
    const redisIncrement = vi.fn().mockResolvedValue(1);
    const translateStrings = vi.fn();

    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
    }));
    vi.doMock("../_lib/sideby.js", () => ({
      getComparisonJob: vi.fn().mockResolvedValue({
        id: "cmp_1",
        status: "completed",
        result: { verdict: { summary: "React is faster to learn." } },
      }),
      sendJson: (res: VercelResponse, payload: unknown, status = 200) => res.status(status).json(payload),
    }));
    vi.doMock("../_lib/redis.js", () => ({
      assertRedisAvailable: vi.fn().mockResolvedValue(undefined),
      redisGet: vi.fn().mockResolvedValue(null),
      redisIncrement,
      redisSet: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock("../_lib/rate-limit.js", () => ({
      checkRateLimit,
      checkGlobalDailyBudget,
    }));
    vi.doMock("../_lib/result-translation.js", () => ({
      TRANSLATION_LANGUAGES: ["az", "ru"],
      collectTranslatableSlots: () => [{ path: ["verdict", "summary"], value: "React is faster to learn." }],
      translationCacheKey: () => "translation:v1:cmp_1:ru:hash",
      applyTranslations: (r: unknown) => r,
      translateStrings,
    }));

    const { default: handler } = await import("./comparisons/[id]/translate.js");

    // 1. Burst limit exceeded -> 429
    const rBurst = makeRes();
    await handler(
      { method: "POST", query: { id: "cmp_1" }, body: { language: "ru" }, headers: {} } as unknown as VercelRequest,
      rBurst.res,
    );
    expect(rBurst.status).toBe(429);
    expect(rBurst.headers["Retry-After"]).toBeDefined();
    expect(translateStrings).not.toHaveBeenCalled();

    // 2. Burst allowed, global cap exhausted -> 503 AT_CAPACITY and refunds daily slot
    checkRateLimit.mockResolvedValueOnce({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: Date.now() + 30_000,
      window: "1m",
    });
    const rCap = makeRes();
    await handler(
      { method: "POST", query: { id: "cmp_1" }, body: { language: "ru" }, headers: {} } as unknown as VercelRequest,
      rCap.res,
    );
    expect(rCap.status).toBe(503);
    expect(redisIncrement).toHaveBeenCalledWith(expect.stringContaining("translate:user_1:"), -1, expect.any(Number));
    expect(translateStrings).not.toHaveBeenCalled();
  });

  it("POST /api/v1/comparisons blocks workspace-scoped API key from writing to another workspace", async () => {
    const createComparisonJob = vi.fn();
    vi.doMock("../_lib/api-key-auth.js", () => ({
      requireApiKey: vi.fn().mockResolvedValue({
        apiKeyId: "key_1",
        userId: "user_1",
        orgId: null,
        workspaceId: "11111111-1111-4111-8111-111111111111",
        scopes: ["comparisons:write", "comparisons:read"],
      }),
      assertApiKeyScope: vi.fn(),
    }));
    vi.doMock("../_lib/sideby.js", () => ({
      createComparisonJob,
      listComparisonHistory: vi.fn(),
      sendJobError: (res: VercelResponse, err: unknown) => res.status(500).json({ error: String(err) }),
      sendJson: (res: VercelResponse, payload: unknown, status = 200) => res.status(status).json(payload),
    }));
    vi.doMock("../_lib/route-guard.js", () => ({
      withApiKeyRateLimit: vi.fn(),
      sendAtCapacityResponse: vi.fn(),
    }));

    const { default: handler } = await import("./v1/comparisons/index.js");
    const r = makeRes();
    await handler(
      {
        method: "POST",
        body: {
          query: "React vs Vue",
          workspaceId: "22222222-2222-4222-8222-222222222222",
        },
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(403);
    expect(createComparisonJob).not.toHaveBeenCalled();
  });

  it("POST /api/settings blocks non-admin org member from overwriting workspaceSettings", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [{ userId: "user_viewer" }],
        }),
      }),
    });

    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_viewer", orgId: "org_1", orgRole: "viewer" }),
    }));
    vi.doMock("../_lib/db-auth.js", () => ({
      canAccessWorkspace: vi.fn().mockResolvedValue(true),
      canAdminWorkspace: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({ insert: mockInsert }),
    }));

    const { default: handler } = await import("./settings.js");
    const r = makeRes();
    await handler(
      {
        method: "POST",
        body: {
          workspaceId: "11111111-1111-4111-8111-111111111111",
          defaultVisibility: "public",
        },
        query: {},
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(403);
    expect(mockInsert).toHaveBeenCalledTimes(1); // Only userSettings, never workspaceSettings
  });

  it("PATCH /api/webhooks/subscriptions/:id blocks non-admin org viewer from modifying another user's org webhook", async () => {
    const mockUpdate = vi.fn();
    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_viewer", orgId: "org_1", orgRole: "viewer" }),
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [{
                id: "sub_1",
                userId: "user_admin",
                organizationId: "org_1",
                url: "https://example.com/hook",
              }],
            }),
          }),
        }),
        update: mockUpdate,
      }),
    }));

    const { default: handler } = await import("./webhooks/subscriptions/[id].js");
    const r = makeRes();
    await handler(
      {
        method: "PATCH",
        query: { id: "sub_1" },
        body: { url: "https://attacker.example/steal" },
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("POST /api/source-feedback rejects javascript: URLs with 400", async () => {
    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
    }));
    vi.doMock("../_lib/db-auth.js", () => ({
      canAccessComparison: vi.fn().mockResolvedValue(true),
    }));
    vi.doMock("../_lib/route-guard.js", () => ({
      withRateLimit: vi.fn(),
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({}),
    }));

    const { default: handler } = await import("./source-feedback.js");
    const r = makeRes();
    await handler(
      {
        method: "POST",
        body: { sourceUrl: "javascript:alert(1)", vote: 1 },
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(400);
  });

  it("GET /api/csrf sets Cache-Control: no-store", async () => {
    const { default: handler } = await import("./csrf.js");
    const r = makeRes();
    handler({ method: "GET", headers: {} } as unknown as VercelRequest, r.res);
    expect(r.status).toBe(200);
    expect(r.headers["Cache-Control"]).toBe("no-store");
  });

  it("Slack verifySlackSignature rejects non-numeric (NaN) and far-future timestamps", async () => {
    const { verifySlackSignature } = await import("./integrations/slack.js");
    const secret = "slack_signing_secret";
    const body = "text=React+vs+Vue";

    const sign = (ts: string) =>
      "v0=" + crypto.createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex");

    expect(verifySlackSignature(body, "not-a-timestamp", sign("not-a-timestamp"), secret)).toBe(false);
    const farFuture = String(Math.floor(Date.now() / 1000) + 3600);
    expect(verifySlackSignature(body, farFuture, sign(farFuture), secret)).toBe(false);

    const now = String(Math.floor(Date.now() / 1000));
    expect(verifySlackSignature(body, now, sign(now), secret)).toBe(true);
  });

  it("isKnownPushService rejects URLs containing embedded credentials", async () => {
    const { isKnownPushService } = await import("./push/subscribe.js");
    expect(isKnownPushService("https://user:pass@fcm.googleapis.com/fcm/send/abc")).toBe(false);
    expect(isKnownPushService("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
  });

  it("GET /api/jobs/drain and /api/watchlists-run safely reject multibyte UTF-8 tokens without RangeError", async () => {
    vi.stubEnv("CRON_SECRET", "abcd1234");
    const { default: drainHandler } = await import("./jobs/drain.js");
    const { default: watchlistsRunHandler } = await import("./watchlists-run.js");

    // 8 UTF-16 code units matching "abcd1234".length, but >8 UTF-8 bytes
    const multibyteToken = "éééééééé";

    const r1 = makeRes();
    await drainHandler(
      { method: "GET", headers: { authorization: `Bearer ${multibyteToken}` } } as unknown as VercelRequest,
      r1.res,
    );
    expect(r1.status).toBe(404);

    const r2 = makeRes();
    await watchlistsRunHandler(
      { method: "GET", headers: { authorization: `Bearer ${multibyteToken}` } } as unknown as VercelRequest,
      r2.res,
    );
    expect(r2.status).toBe(404);
  });

  it("POST /api/knowledge/search returns 400 (not 500) on invalid Zod payload", async () => {
    vi.doMock("../_lib/auth.js", () => ({
      requireAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
    }));
    vi.doMock("../_lib/rate-limit.js", () => ({
      checkRateLimit: vi.fn(),
    }));
    vi.doMock("../../src/db/index.js", () => ({
      createDbClient: () => ({}),
    }));

    const { default: handler } = await import("./knowledge.js");
    const r = makeRes();
    await handler(
      {
        method: "POST",
        query: { action: "search" },
        body: { query: "", workspaceId: "not-a-uuid" },
        headers: {},
      } as unknown as VercelRequest,
      r.res,
    );

    expect(r.status).toBe(400);
  });
});
