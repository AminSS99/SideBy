import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, apiFetch, shouldReportApiError } from "../api";

/**
 * In-flight GET collapsing was removed for the release candidate: identity,
 * outcomes and errors are never resolved or stored on behalf of another
 * caller. These tests hold the replacement contract.
 */
describe("apiFetch request ownership (no shared in-flight bucket)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const okResponse = (url: string) =>
    ({
      ok: true,
      status: 200,
      url,
      headers: { get: () => null },
      clone() {
        return { ...this };
      },
      json: async () => ({ message: "success", url }),
    }) as unknown as Response;

  it("dispatches every identical GET independently", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return okResponse(url);
    });
    vi.stubGlobal("fetch", mockFetch);

    const responses = await Promise.all(
      Array.from({ length: 5 }).map(() => apiFetch("/api/test-ownership")),
    );

    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(responses.length).toBe(5);
    for (const res of responses) {
      expect(res.ok).toBe(true);
      expect(await res.json()).toEqual({ message: "success", url: "/api/test-ownership" });
    }
  });

  it("keeps POST requests independent (hooks confirm no coalescing exists at all)", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return okResponse(url);
    });
    vi.stubGlobal("fetch", mockFetch);

    await Promise.all(
      Array.from({ length: 3 }).map(() => apiFetch("/api/test-post", { method: "POST" })),
    );

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("separate retry policies never share an in-flight chain", async () => {
    const errorResponse = (url: string) =>
      ({
        ok: false,
        status: 500,
        url,
        headers: { get: () => null },
        clone() {
          return { ...this };
        },
        json: async () => ({ error: "server down" }),
      }) as unknown as Response;
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return errorResponse(url);
    });
    vi.stubGlobal("fetch", mockFetch);

    const [zeroRetry, defaultRetry] = await Promise.allSettled([
      apiFetch("/api/retry-policy", {}, { retries: 0 }),
      apiFetch("/api/retry-policy", {}, { retries: 2, retryDelay: 1 }),
    ]);

    // The default-retry call makes three attempts; the zero-retry call
    // exactly one. A shared retry chain would have forced one count on both.
    expect(zeroRetry.status).toBe("rejected");
    expect(defaultRetry.status).toBe("rejected");
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});

describe("apiFetch Sentry filtering", () => {
  it.each([400, 401, 403, 404, 409, 422, 429])(
    "does not report expected HTTP %s responses",
    (status) => {
      expect(shouldReportApiError(new ApiError("Expected response", status))).toBe(false);
    },
  );

  it.each([408, 500, 502, 503])("reports actionable HTTP %s responses", (status) => {
    expect(shouldReportApiError(new ApiError("Service failure", status))).toBe(true);
  });

  it("does not report intentional request cancellation", () => {
    const error = new Error("Request cancelled");
    error.name = "AbortError";

    expect(shouldReportApiError(error)).toBe(false);
  });

  it("reports unexpected network failures", () => {
    expect(shouldReportApiError(new TypeError("Failed to fetch"))).toBe(true);
  });
});
