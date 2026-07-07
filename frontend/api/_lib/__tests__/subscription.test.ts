import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFreeLimits } from "../subscription";

describe("getFreeLimits", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should use default limits when environment variables are not set", () => {
    // Clear the specific env vars we are testing
    delete process.env.FREE_COMPARISONS_PER_DAY;
    delete process.env.FREE_FOLLOWUPS_PER_DAY;
    delete process.env.FREE_REFRESHES_PER_DAY;
    delete process.env.FREE_EXPORTS_PER_DAY;
    delete process.env.FREE_WATCHLISTS_PER_DAY;

    const limits = getFreeLimits();

    expect(limits).toEqual({
      comparisonsPerDay: 5,
      followUpsPerDay: 10,
      refreshesPerDay: 3,
      exportsPerDay: 10,
      watchlistsPerDay: 5,
    });
  });

  it("should parse environment variables as numbers", () => {
    process.env.FREE_COMPARISONS_PER_DAY = "10";
    process.env.FREE_FOLLOWUPS_PER_DAY = "20";
    process.env.FREE_REFRESHES_PER_DAY = "5";
    process.env.FREE_EXPORTS_PER_DAY = "15";
    process.env.FREE_WATCHLISTS_PER_DAY = "8";

    const limits = getFreeLimits();

    expect(limits).toEqual({
      comparisonsPerDay: 10,
      followUpsPerDay: 20,
      refreshesPerDay: 5,
      exportsPerDay: 15,
      watchlistsPerDay: 8,
    });
  });

  it("should handle invalid environment variables gracefully (falling back to NaN or handling as expected by Number())", () => {
    process.env.FREE_COMPARISONS_PER_DAY = "invalid";
    const limits = getFreeLimits();
    expect(Number.isNaN(limits.comparisonsPerDay)).toBe(true);
  });
});
