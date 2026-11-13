import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const deps = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createDbClient: vi.fn(),
  innerJoinSpy: vi.fn(),
  cacheSize: vi.fn(() => 42),
}));

vi.mock("../_lib/auth.js", () => ({
  requireAuth: deps.requireAuth,
}));

vi.mock("../_lib/rate-limit.js", () => ({
  getUsageStatus: vi.fn(),
  getMonthlyUsageStatus: vi.fn(),
}));

vi.mock("../_lib/sideby.js", () => ({
  sendJson: (res: VercelResponse, payload: unknown, status = 200) =>
    res.status(status).json(payload),
}));

vi.mock("../_lib/subscription.js", () => ({
  resolveSubscriptionState: vi.fn(),
}));

vi.mock("../_lib/cache-layer.js", () => ({
  comparisonCache: { size: deps.cacheSize },
}));

vi.mock("../../src/db/index.js", () => ({
  createDbClient: deps.createDbClient,
}));

import handler from "./usage.js";

function makeThenableBuilder() {
  const builder: Record<string, unknown> = {
    from: () => builder,
    leftJoin: () => builder,
    innerJoin: (...args: unknown[]) => {
      deps.innerJoinSpy(...args);
      return builder;
    },
    where: () => builder,
    groupBy: () => builder,
    orderBy: () => builder,
    limit: () => Promise.resolve([]),
    then: (onFulfilled: (value: unknown[]) => unknown) =>
      Promise.resolve([]).then(onFulfilled),
  };
  return builder;
}

async function runQualityRequest() {
  let status = 200;
  let body: unknown;
  const res = {
    status: (code: number) => {
      status = code;
      return res;
    },
    json: (payload: unknown) => {
      body = payload;
      return res;
    },
  };
  const req = {
    method: "GET",
    query: { type: "quality" },
    headers: {},
  } as unknown as VercelRequest;

  await handler(req, res as unknown as VercelResponse);
  return { status, body };
}

describe("GET /api/usage?type=quality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    deps.createDbClient.mockReturnValue({
      select: () => makeThenableBuilder(),
    });
  });

  it("blocks users without an active org even if orgRole is org:admin", async () => {
    deps.requireAuth.mockResolvedValueOnce({
      userId: "user_1",
      orgId: null,
      orgRole: "org:admin",
    });

    const res = await runQualityRequest();
    expect(res.status).toBe(403);
    expect(deps.createDbClient).not.toHaveBeenCalled();
  });

  it("blocks regular org members", async () => {
    deps.requireAuth.mockResolvedValueOnce({
      userId: "user_2",
      orgId: "org_1",
      orgRole: "org:member",
    });

    const res = await runQualityRequest();
    expect(res.status).toBe(403);
    expect(deps.createDbClient).not.toHaveBeenCalled();
  });

  it("scopes quality analytics to active org for org admins and hides global cache size", async () => {
    deps.requireAuth.mockResolvedValueOnce({
      userId: "user_org_admin",
      orgId: "org_tenant_1",
      orgRole: "org:admin",
    });

    const res = await runQualityRequest();
    expect(res.status).toBe(200);
    expect(deps.innerJoinSpy).toHaveBeenCalled();
    expect(
      (res.body as { cache: { memorySize: number } }).cache.memorySize,
    ).toBe(0);
  });

  it("allows global quality dashboard only for explicit SIDEBY_PLATFORM_ADMIN_USER_IDS", async () => {
    vi.stubEnv("SIDEBY_PLATFORM_ADMIN_USER_IDS", "user_platform_admin");
    deps.requireAuth.mockResolvedValueOnce({
      userId: "user_platform_admin",
      orgId: null,
      orgRole: null,
    });

    const res = await runQualityRequest();
    expect(res.status).toBe(200);
    expect(deps.innerJoinSpy).not.toHaveBeenCalled();
    expect(
      (res.body as { cache: { memorySize: number } }).cache.memorySize,
    ).toBe(42);
  });
});
