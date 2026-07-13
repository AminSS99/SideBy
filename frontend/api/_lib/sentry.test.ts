import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "../[...path].js";
import { Sentry } from "./sentry.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

vi.mock("./sentry.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("./sentry.js")>();
  return {
    ...original,
    initServerSentry: vi.fn(),
    Sentry: {
      ...original.Sentry,
      captureException: vi.fn(),
      flush: vi.fn().mockResolvedValue(true),
    },
  };
});

describe("Sentry API Route Error Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should catch unhandled exceptions, report them to Sentry, flush the queue, and return a 500 response", async () => {
    const req = {
      query: { path: "health", sentry_test: "true" },
      method: "GET",
    } as unknown as VercelRequest;

    let statusCode = 0;
    let jsonPayload: { error?: string; message?: string } | null = null;

    const res = {
      status: vi.fn().mockImplementation((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn().mockImplementation((payload) => {
        jsonPayload = payload;
        return res;
      }),
    } as unknown as VercelResponse;

    await handler(req, res);

    // Verify Sentry captures the error thrown by health endpoint
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(Sentry.flush).toHaveBeenCalledWith(2000);

    // Verify we returned 500
    expect(statusCode).toBe(500);
    expect(jsonPayload.error).toBe("Internal Server Error");
    expect(jsonPayload.message).toContain("Sentry verification test error");
  });
});
