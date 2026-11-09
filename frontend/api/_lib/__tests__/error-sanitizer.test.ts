import { describe, expect, it, vi } from "vitest";
import { sanitizeErrorPayload } from "../sideby.js";

describe("sanitizeErrorPayload", () => {
  it("hides SQL and parameters on 5xx", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const out = sanitizeErrorPayload(
      { error: 'Failed query: insert into "comparisons" ("id") values ($1) params: abc,user_123' },
      500,
    ) as { error: string };
    expect(out.error).not.toMatch(/insert|params|user_123/i);
  });
  it("keeps intentional short messages and non-5xx payloads", () => {
    expect(sanitizeErrorPayload({ error: "Redis is unavailable. Please try again shortly." }, 503)).toEqual({
      error: "Redis is unavailable. Please try again shortly.",
    });
    expect(sanitizeErrorPayload({ error: "insert into x values" }, 400)).toEqual({ error: "insert into x values" });
  });
});
