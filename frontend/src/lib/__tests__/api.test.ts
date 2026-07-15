import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, apiFetch, shouldReportApiError } from "../api";

describe("apiFetch Request Collapsing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should collapse multiple identical GET requests into a single fetch call", async () => {
    let fetchCallCount = 0;

    // Mock global fetch
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      fetchCallCount++;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        ok: true,
        status: 200,
        url,
        clone() {
          return { ...this };
        },
        json: async () => ({ message: "success", url })
      } as unknown as Response;
    });

    vi.stubGlobal("fetch", mockFetch);

    // Fire 5 requests concurrently
    const promises = Array.from({ length: 5 }).map(() => apiFetch("/api/test-collapse"));

    const responses = await Promise.all(promises);

    // global.fetch should only be called once
    expect(fetchCallCount).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Check that we got 5 valid, separate responses
    expect(responses.length).toBe(5);

    for (const res of responses) {
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toEqual({ message: "success", url: "/api/test-collapse" });
    }
  });

  it("should not collapse POST requests", async () => {
    let fetchCallCount = 0;

    // Mock global fetch
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      fetchCallCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        ok: true,
        status: 200,
        url,
        clone() { return { ...this }; },
        json: async () => ({ message: "success" })
      } as unknown as Response;
    });

    vi.stubGlobal("fetch", mockFetch);

    // Fire 3 POST requests concurrently
    const promises = Array.from({ length: 3 }).map(() =>
      apiFetch("/api/test-no-collapse", { method: "POST" })
    );

    await Promise.all(promises);

    // global.fetch should be called 3 times
    expect(fetchCallCount).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(3);
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
