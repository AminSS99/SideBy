import { beforeEach, describe, expect, it, vi } from "vitest";

const deps = vi.hoisted(() => ({
  acquireLock: vi.fn(),
  releaseLock: vi.fn(),
  forceReleaseLock: vi.fn(),
  selectResults: [] as unknown[][],
  updateSetSpy: vi.fn(),
  getPrimaryProvider: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("../../../src/db/index.js", () => ({
  createDbClient: () => ({
    select: () => {
      const nextResult = deps.selectResults.shift() ?? [];
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => Promise.resolve(nextResult),
        then: (onFulfilled: (val: unknown[]) => unknown) =>
          Promise.resolve(nextResult).then(onFulfilled),
      };
      return chain;
    },
    update: () => ({
      set: (values: unknown) => {
        deps.updateSetSpy(values);
        return {
          where: () => Promise.resolve([]),
        };
      },
    }),
  }),
}));

vi.mock("../redis.js", () => ({
  redisAcquireLockToken: deps.acquireLock,
  redisReleaseLock: deps.releaseLock,
  redisForceReleaseLock: deps.forceReleaseLock,
}));

vi.mock("../providers/index.js", () => ({
  getPrimaryProvider: deps.getPrimaryProvider,
}));

vi.mock("../log.js", () => ({
  logger: {
    info: vi.fn(),
    warn: deps.loggerWarn,
    error: vi.fn(),
  },
}));

import { drainQueuedComparisonJobs, runComparisonJob } from "../job-engine.js";

describe("job-engine global concurrency limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    deps.selectResults.length = 0;
    deps.acquireLock.mockResolvedValue({ key: "job-lock:cmp_1", token: "tok_1" });
    deps.releaseLock.mockResolvedValue(undefined);
  });

  it("defers queued execution without failing or bumping retryCount when at global concurrency cap", async () => {
    vi.stubEnv("MAX_GLOBAL_ACTIVE_COMPARISONS", "2");
    deps.selectResults.push(
      [{ retryCount: 0, status: "queued" }], // comparison retry/status lookup
      [{ count: 2 }], // active running count
    );

    await runComparisonJob("cmp_1", "user_1", "React vs Vue");

    expect(deps.getPrimaryProvider).not.toHaveBeenCalled();
    expect(deps.updateSetSpy).not.toHaveBeenCalled();
    expect(deps.releaseLock).toHaveBeenCalledWith({
      key: "job-lock:cmp_1",
      token: "tok_1",
    });
    expect(deps.loggerWarn).toHaveBeenCalledWith(
      "Deferring comparison job until active concurrency slot frees up",
      expect.objectContaining({ comparisonId: "cmp_1", activeCount: 2, maxActive: 2 }),
    );
  });

  it("does not dequeue additional jobs when active capacity is already exhausted", async () => {
    vi.stubEnv("MAX_GLOBAL_ACTIVE_COMPARISONS", "3");
    deps.selectResults.push(
      [
        {
          id: "cmp_queued_1",
          query: "React vs Vue",
          clerkUserId: "user_1",
          clerkOrgId: null,
          retryCount: 0,
          updatedAt: new Date("2026-11-13T10:00:00.000Z"),
          status: "queued",
        },
      ],
      [{ count: 3 }],
    );

    const summary = await drainQueuedComparisonJobs(5);
    expect(summary).toEqual({ scanned: 1, due: 0, started: 0 });
    expect(deps.acquireLock).not.toHaveBeenCalled();
  });
});
