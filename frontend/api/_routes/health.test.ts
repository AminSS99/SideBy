import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./health.js";

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

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns process health without requiring infrastructure configuration", async () => {
    const request = { method: "GET", query: {} } as unknown as VercelRequest;
    const result = createResponse();

    await handler(request, result.response);

    expect(result.getStatusCode()).toBe(200);
    expect(result.getPayload()).toMatchObject({ status: "ok" });
  });

  it("rejects non-GET requests", async () => {
    const request = { method: "POST", query: {} } as unknown as VercelRequest;
    const result = createResponse();

    await handler(request, result.response);

    expect(result.getStatusCode()).toBe(405);
  });
});
