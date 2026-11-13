import { afterEach, describe, expect, it, vi } from "vitest";
import { getJobLimits } from "../job-limits.js";

const defaults = { maxCostUsd: 0.5, maxTimeMs: 300_000, maxSearchCalls: 12, maxAiCalls: 6 };
const keys = ["MAX_JOB_COST_USD", "MAX_JOB_TIME_MS", "MAX_SEARCH_CALLS", "MAX_AI_CALLS"];
afterEach(() => vi.unstubAllEnvs());

describe("paid research guardrail settings", () => {
  it.each(["NaN", "Infinity", "-1", "invalid"])("retains limits for malformed settings: %s", (value) => {
    for (const key of keys) vi.stubEnv(key, value);
    expect(getJobLimits()).toEqual(defaults);
  });

  it("rejects fractional call and time limits while allowing fractional dollars", () => {
    for (const key of keys) vi.stubEnv(key, "1.5");
    expect(getJobLimits()).toEqual({ ...defaults, maxCostUsd: 1.5 });
  });

  it("preserves explicitly configured zero limits", () => {
    for (const key of keys) vi.stubEnv(key, "0");
    expect(getJobLimits()).toEqual({ maxCostUsd: 0, maxTimeMs: 0, maxSearchCalls: 0, maxAiCalls: 0 });
  });
});
