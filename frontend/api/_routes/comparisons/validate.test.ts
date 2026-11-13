import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const deps = vi.hoisted(() => ({
  limit: vi.fn(async () => ({ allowed: true })),
  validate: vi.fn(async () => ({ intent: { canStart: true } })),
}));
vi.mock("../../_lib/rate-limit.js", () => ({ checkRateLimit: deps.limit }));
vi.mock("../../_lib/comparison-validator.js", () => ({ validateComparisonQuery: deps.validate }));
vi.mock("../../_lib/log.js", () => ({ logger: { warn: vi.fn() } }));
import handler from "./validate.js";

async function run() {
  let status = 200;
  let body: unknown;
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (key: string, value: string) => { headers[key] = value; },
    status: (code: number) => { status = code; return res; },
    json: (value: unknown) => { body = value; return res; },
  };
  await handler({ method: "POST", headers: { "x-forwarded-for": "192.0.2.1" }, body: { query: "iPhone vs Pixel" } } as unknown as VercelRequest, res as unknown as VercelResponse);
  return { status, body, headers };
}

describe("public eligibility safeguards", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });

  it.each(["NaN", "Infinity", "-1", "1.5"])("retains the global limit for an invalid setting: %s", async (value) => {
    vi.stubEnv("VALIDATION_AI_GLOBAL_PER_MIN", value);
    await run();
    expect(deps.limit).toHaveBeenLastCalledWith("ip", "global", "comparison-validation-ai", 60);
  });

  it("preserves zero as a deliberate stop for AI validation", async () => {
    vi.stubEnv("VALIDATION_AI_GLOBAL_PER_MIN", "0");
    await run();
    expect(deps.limit).toHaveBeenLastCalledWith("ip", "global", "comparison-validation-ai", 0);
  });

  it("does not return internal provider errors to anonymous visitors", async () => {
    deps.validate.mockRejectedValueOnce(new Error("provider credentials and internal host details"));
    const result = await run();
    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain("credentials");
  });

  it("returns a retryable response when admission storage is unavailable", async () => {
    deps.limit.mockRejectedValueOnce(Object.assign(new Error("internal store unavailable"), { statusCode: 503 }));
    const result = await run();
    expect(result.status).toBe(503);
    expect(result.headers["Retry-After"]).toBe("60");
    expect(deps.validate).not.toHaveBeenCalled();
  });
});
