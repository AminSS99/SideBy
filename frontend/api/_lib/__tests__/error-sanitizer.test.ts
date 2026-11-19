import { describe, expect, it, vi } from "vitest";
import { sanitizeErrorMessage, sanitizeErrorPayload } from "../sideby.js";

describe("sanitizeErrorPayload", () => {
  it("hides SQL and parameters on 5xx", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const out = sanitizeErrorPayload(
      { error: 'Failed query: insert into "comparisons" ("id") values ($1) params: abc,user_123' },
      500,
    ) as { error: string };
    expect(out.error).not.toMatch(/insert|params|user_123/i);
  });
  it("hides upstream network and credential details on 5xx", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const netOut = sanitizeErrorPayload(
      { error: "connect ECONNREFUSED 10.0.0.5:5432" },
      500,
    ) as { error: string };
    expect(netOut.error).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/i);

    const tokenOut = sanitizeErrorPayload(
      { error: "Authorization failed for Bearer sk_live_secret123" },
      502,
    ) as { error: string };
    expect(tokenOut.error).not.toMatch(/sk_live_secret123|Bearer/i);
  });
  it("sanitizes stored internal job error messages", () => {
    expect(sanitizeErrorMessage("connect ETIMEDOUT 10.1.2.3:443")).toBe(
      "Something went wrong on our side. Please try again in a moment.",
    );
    expect(sanitizeErrorMessage("Rate limit exceeded")).toBe("Rate limit exceeded");
  });
  it("keeps intentional short messages and non-5xx payloads", () => {
    expect(sanitizeErrorPayload({ error: "Redis is unavailable. Please try again shortly." }, 503)).toEqual({
      error: "Redis is unavailable. Please try again shortly.",
    });
    expect(sanitizeErrorPayload({ error: "insert into x values" }, 400)).toEqual({ error: "insert into x values" });
  });
});
