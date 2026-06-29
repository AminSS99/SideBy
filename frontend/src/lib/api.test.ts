import { apiFetch } from "./api";
import { describe, it, expect, vi } from "vitest";

describe("apiFetch request collapsing", () => {
  it("should collapse multiple identical concurrent GET requests into one fetch call", async () => {
    let fetchCallCount = 0;

    // Mock global fetch
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      fetchCallCount++;
      return new Response(JSON.stringify({ data: "test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const p1 = apiFetch("http://localhost:3000/api/test");
    const p2 = apiFetch("http://localhost:3000/api/test");
    const p3 = apiFetch("http://localhost:3000/api/test");

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    const j1 = await r1.json();
    const j2 = await r2.json();
    const j3 = await r3.json();

    expect(fetchCallCount).toBe(1); // Should only make one network request
    expect(j1).toEqual({ data: "test" });
    expect(j2).toEqual({ data: "test" });
    expect(j3).toEqual({ data: "test" });
  });
});
