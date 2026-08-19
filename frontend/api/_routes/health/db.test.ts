import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./db.js";

const { neonMock, sqlMock } = vi.hoisted(() => ({
  neonMock: vi.fn(),
  sqlMock: vi.fn(),
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: neonMock,
}));

function createResponse() {
  let statusCode = 0;
  let payload: unknown;
  const response = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      payload = body;
      return response;
    }),
  } as unknown as VercelResponse;

  return {
    response,
    getStatusCode: () => statusCode,
    getPayload: () => payload,
  };
}

function createRequest(token?: string) {
  return {
    method: "GET",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as VercelRequest;
}

describe("GET /api/health/db", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HEALTHCHECK_SECRET = "monitor-secret";
    process.env.DATABASE_URL = "postgres://example.test/sideby";
    neonMock.mockReturnValue(sqlMock);
    sqlMock.mockResolvedValue([{ "?column?": 1 }]);
  });

  afterEach(() => {
    delete process.env.HEALTHCHECK_SECRET;
    delete process.env.DATABASE_URL;
  });

  it("does not query Neon without valid authentication", async () => {
    const result = createResponse();

    await handler(createRequest("wrong-secret"), result.response);

    expect(result.getStatusCode()).toBe(401);
    expect(neonMock).not.toHaveBeenCalled();
  });

  it("queries Neon for an authenticated deep check", async () => {
    const result = createResponse();

    await handler(createRequest("monitor-secret"), result.response);

    expect(result.getStatusCode()).toBe(200);
    expect(result.getPayload()).toMatchObject({ status: "ok" });
    expect(neonMock).toHaveBeenCalledWith("postgres://example.test/sideby");
    expect(sqlMock).toHaveBeenCalledOnce();
  });

  it("returns degraded when Neon cannot be reached", async () => {
    sqlMock.mockRejectedValueOnce(new Error("database unavailable"));
    const result = createResponse();

    await handler(createRequest("monitor-secret"), result.response);

    expect(result.getStatusCode()).toBe(503);
    expect(result.getPayload()).toMatchObject({ status: "degraded" });
  });
});
