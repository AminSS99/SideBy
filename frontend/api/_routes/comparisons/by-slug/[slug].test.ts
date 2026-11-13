import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const deps = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  createDbClient: vi.fn(),
}));

vi.mock("../../../_lib/rate-limit.js", () => ({
  checkRateLimit: deps.checkRateLimit,
}));

vi.mock("../../../_lib/route-guard.js", () => ({
  getClientIp: () => "198.51.100.77",
}));

vi.mock("../../../../src/db/index.js", () => ({
  createDbClient: deps.createDbClient,
}));

vi.mock("../../../_lib/auth.js", () => ({
  authenticateRequest: vi.fn(async () => ({ userId: null })),
}));

vi.mock("../../../_lib/sideby.js", () => ({
  loadPublishEvidence: vi.fn(),
  sendJson: (res: VercelResponse, payload: unknown, status = 200) =>
    res.status(status).json(payload),
}));

vi.mock("../../../_lib/log.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import handler from "./[slug].js";

function makeRes() {
  let status = 200;
  let body: unknown;
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    status: (code: number) => {
      status = code;
      return res;
    },
    json: (payload: unknown) => {
      body = payload;
      return res;
    },
    end: () => res,
  };
  return { res: res as unknown as VercelResponse, result: () => ({ status, body, headers }) };
}

describe("GET /api/comparisons/by-slug/:slug burst protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.createDbClient.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => [],
            }),
          }),
        }),
      }),
    });
  });

  it("returns 429 with Retry-After when public slug IP burst cap is exceeded", async () => {
    deps.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      resetAt: Date.now() + 30_000,
    });

    const { res, result } = makeRes();
    const req = {
      method: "GET",
      query: { slug: "react-vs-vue" },
      headers: {},
    } as unknown as VercelRequest;

    await handler(req, res);
    const out = result();
    expect(out.status).toBe(429);
    expect(out.headers["Retry-After"]).toBeDefined();
    expect(deps.createDbClient).not.toHaveBeenCalled();
  });

  it("fails open to keep public pages readable if rate-limit store is temporarily unavailable", async () => {
    deps.checkRateLimit.mockRejectedValueOnce(new Error("KV unreachable"));

    const { res, result } = makeRes();
    const req = {
      method: "GET",
      query: { slug: "react-vs-vue" },
      headers: {},
    } as unknown as VercelRequest;

    await handler(req, res);
    expect(result().status).toBe(404);
    expect(deps.createDbClient).toHaveBeenCalled();
  });
});
