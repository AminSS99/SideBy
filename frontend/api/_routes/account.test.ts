import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuth = vi.fn();
const dbDelete = vi.fn();
const dbSelect = vi.fn();

vi.mock("../_lib/auth.js", () => ({ requireAuth }));
vi.mock("../_lib/db-auth.js", () => ({
  getAccessibleWorkspaces: vi.fn(async () => []),
}));
vi.mock("../../src/db/index.js", () => ({
  createDbClient: () => ({
    select: dbSelect,
    delete: dbDelete,
  }),
}));

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

const call = async (body: unknown, method = "DELETE", query: Record<string, string> = {}) => {
  const { default: handler } = await import("./account.js");
  const res = makeResponse();
  await handler({ method, body, query, headers: {} } as never, res as never);
  return res;
};

describe("DELETE /api/account", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_mock_secret");
    const mockWhere = vi.fn().mockResolvedValue([]);
    dbDelete.mockReturnValue({ where: mockWhere });
    const mockLimit = vi.fn().mockResolvedValue([]);
    dbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockLimit,
        }),
      }),
    });
  });

  it("rejects without confirm: DELETE", async () => {
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
      iat: Math.floor(Date.now() / 1000),
    });
    const res = await call({ confirm: "NO" });
    expect(res.statusCode).toBe(400);
    expect(dbDelete).not.toHaveBeenCalled();
  });

  it("rejects with 403 when session token iat is older than 10 minutes", async () => {
    const elevenMinutesAgo = Math.floor(Date.now() / 1000) - 11 * 60;
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
      iat: elevenMinutesAgo,
    });
    const res = await call({ confirm: "DELETE" });
    expect(res.statusCode).toBe(403);
    const body = res.body as { error: string };
    expect(body.error).toMatch(/recent authentication required/i);
    expect(dbDelete).not.toHaveBeenCalled();
  });

  it("rejects with 403 when session token iat is missing", async () => {
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
    });
    const res = await call({ confirm: "DELETE" });
    expect(res.statusCode).toBe(403);
    expect(dbDelete).not.toHaveBeenCalled();
  });

  it("deletes DB rows and deletes Clerk user via API when session is recent", async () => {
    const freshIat = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
      iat: freshIat,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "user_delete_1", object: "user", deleted: true }),
    });
    global.fetch = mockFetch;

    try {
      const res = await call({ confirm: "DELETE" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(dbDelete).toHaveBeenCalledTimes(2); // workspaces and users
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.clerk.com/v1/users/user_delete_1",
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer sk_test_mock_secret",
          },
        },
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("treats 404 from Clerk as successful deletion", async () => {
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
      iat: Math.floor(Date.now() / 1000),
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "User not found",
    });
    global.fetch = mockFetch;

    try {
      const res = await call({ confirm: "DELETE" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("returns 502 when Clerk API returns an error", async () => {
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
      iat: Math.floor(Date.now() / 1000),
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Clerk internal error",
    });
    global.fetch = mockFetch;

    try {
      const res = await call({ confirm: "DELETE" });
      expect(res.statusCode).toBe(502);
      expect((res.body as { error: string }).error).toMatch(/clerk user deletion failed/i);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("returns 503 when CLERK_SECRET_KEY is missing", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    requireAuth.mockResolvedValue({
      userId: "user_delete_1",
      iat: Math.floor(Date.now() / 1000),
    });

    const res = await call({ confirm: "DELETE" });
    expect(res.statusCode).toBe(503);
    expect((res.body as { error: string }).error).toMatch(/clerk secret key is required/i);
  });
});
