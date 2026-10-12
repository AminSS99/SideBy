import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const mockComparisonsInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) });
const mockQueryAnalyticsInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) });

let mockSelectRows: Record<string, unknown>[] = [];
// Optional per-call select results: consumed in order, then falls back to mockSelectRows.
let mockSelectQueue: Record<string, unknown>[][] = [];
const mockSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    innerJoin: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() =>
            Promise.resolve(
              mockSelectQueue.length > 0 ? mockSelectQueue.shift()! : mockSelectRows,
            ),
          ),
        }),
      }),
    }),
  }),
});

process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";

vi.mock("../../../src/db/index.js", () => ({
  createDbClient: () => ({
    select: mockSelect,
    insert: (table: unknown) => {
      const target = table as { _?: { name?: string } } | undefined;
      if (target?._?.name === "query_analytics") {
        return mockQueryAnalyticsInsert();
      }
      return mockComparisonsInsert();
    },
  }),
}));

vi.mock("../comparison-validator.js", () => ({
  validateComparisonQuery: vi.fn().mockResolvedValue({
    intent: {
      canStart: true,
      category: "software",
      taxonomyStatus: "ready",
      confidence: 0.95,
      safetyLevel: "standard",
      policyNote: null,
      sourceRequirements: [],
    },
  }),
}));

vi.mock("../job-engine.js", () => ({
  runComparisonJob: vi.fn().mockResolvedValue({}),
}));

let mockLockAcquired = true;
let mockLockValid = true;
vi.mock("../redis.js", () => ({
  redisAcquireLockToken: vi.fn().mockImplementation((key: string) => {
    if (!mockLockAcquired) return Promise.resolve(null);
    return Promise.resolve({ key, token: "mock-token-123" });
  }),
  redisReleaseLock: vi.fn().mockResolvedValue(undefined),
  redisRenewLockToken: vi.fn().mockImplementation(() => Promise.resolve(mockLockValid)),
  redisVerifyLockToken: vi.fn().mockImplementation(() => Promise.resolve(mockLockValid)),
}));

import { redisAcquireLockToken, redisReleaseLock, redisVerifyLockToken } from "../redis.js";
import { runComparisonJob } from "../job-engine.js";

describe("createComparisonJob - in-flight duplicate intent locking & scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectRows = [];
    mockSelectQueue = [];
    mockLockAcquired = true;
    mockLockValid = true;
  });

  it("reuses existing in-flight job within same workspace and project", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    const existingJob = {
      id: "comp-existing-123",
      status: "running",
      progress: 45,
      activeStep: 2,
      query: "Next.js vs Remix",
      result: null,
      visibility: "private",
      errorMessage: null,
    };

    mockSelectRows = [existingJob];

    const result = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_alpha",
      projectId: "proj_beta",
    });

    expect(result.id).toBe("comp-existing-123");
    expect(result.status).toBe("running");
    expect(mockComparisonsInsert).not.toHaveBeenCalled();
  });

  it("differentiates jobs across different users with identical queries", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];

    const first = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_alpha",
    });
    const second = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_beta",
    });

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);

    const lockKeys = vi.mocked(redisAcquireLockToken).mock.calls.map((call) => call[0]);
    expect(lockKeys.some((key) => key.includes("user_alpha"))).toBe(true);
    expect(lockKeys.some((key) => key.includes("user_beta"))).toBe(true);
  });

  it("differentiates jobs across different workspaces for the same user", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];

    const first = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_one",
    });
    const second = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_two",
    });

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);

    const lockKeys = vi.mocked(redisAcquireLockToken).mock.calls.map((call) => call[0]);
    expect(lockKeys.some((key) => key.includes("ws_one"))).toBe(true);
    expect(lockKeys.some((key) => key.includes("ws_two"))).toBe(true);
  });

  it("differentiates jobs across different projects within the same workspace", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];

    const first = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_alpha",
      projectId: "proj_one",
    });
    const second = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_alpha",
      projectId: "proj_two",
    });

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);

    const lockKeys = vi.mocked(redisAcquireLockToken).mock.calls.map((call) => call[0]);
    expect(lockKeys.some((key) => key.includes("proj_one"))).toBe(true);
    expect(lockKeys.some((key) => key.includes("proj_two"))).toBe(true);
  });

  it("scopes locks by user, workspace, project, and null placeholders", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];

    await createComparisonJob({ query: "Next.js vs Remix", userId: "user_test_1" });
    await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_alpha",
    });
    await createComparisonJob({ query: "Next.js vs Remix", userId: "user_other" });

    const lockKeys = vi.mocked(redisAcquireLockToken).mock.calls.map((call) => call[0] as string);
    // Null workspace/project use explicit placeholders so they never match a real scope.
    expect(lockKeys[0]).toContain("user_test_1:none:none:");
    expect(lockKeys[1]).toContain("user_test_1:ws_alpha:none:");
    expect(lockKeys[2]).toContain("user_other:none:none:");
    expect(new Set(lockKeys).size).toBe(3);
  });

  it("releases the lock with ownership verification when the protected section fails", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];
    mockComparisonsInsert.mockReturnValueOnce({
      values: vi.fn().mockRejectedValue(new Error("db insert failed")),
    });

    await expect(
      createComparisonJob({
        query: "Next.js vs Remix",
        userId: "user_test_1",
        workspaceId: "ws_alpha",
      }),
    ).rejects.toThrow("db insert failed");

    expect(redisReleaseLock).toHaveBeenCalledWith(
      expect.objectContaining({ token: "mock-token-123" }),
    );
    expect(runComparisonJob).not.toHaveBeenCalled();
  });

  it("aborts insertion and reports 409 if lock verification is lost during slow processing", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];
    // Simulating lock loss during preparation
    mockLockValid = false;

    await expect(
      createComparisonJob({
        query: "Next.js vs Remix",
        userId: "user_test_1",
        workspaceId: "ws_alpha",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "COMPARISON_IN_PROGRESS",
    });

    expect(mockComparisonsInsert).not.toHaveBeenCalled();
    expect(redisReleaseLock).toHaveBeenCalled();
  });

  it("handles lock contention by waiting and adopting the concurrently created job", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    // First attempt fails to acquire lock, then job becomes available in DB
    mockLockAcquired = false;
    setTimeout(() => {
      mockSelectRows = [
        {
          id: "comp-concurrent-456",
          status: "queued",
          progress: 0,
          activeStep: 0,
          query: "Next.js vs Remix",
          result: null,
          visibility: "private",
          errorMessage: null,
        },
      ];
    }, 100);

    const result = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_alpha",
    });

    expect(result.id).toBe("comp-concurrent-456");
    expect(mockComparisonsInsert).not.toHaveBeenCalled();
  });

  it("adopts the winner when the insert hits the in-flight uniqueness constraint", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    const winner = {
      id: "comp-winner-789",
      status: "running",
      progress: 10,
      activeStep: 1,
      query: "Next.js vs Remix",
      result: null,
      visibility: "private",
      errorMessage: null,
    };
    // Pre-insert checks (in-flight, reuse, final pre-insert) see nothing; the
    // loser's INSERT then collides with the winner's row (lock expired
    // between verification and write).
    mockSelectQueue = [[], [], []];
    mockComparisonsInsert.mockReturnValueOnce({
      values: vi.fn().mockRejectedValue(Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" })),
    });
    mockSelectRows = [winner];

    const result = await createComparisonJob({
      query: "Next.js vs Remix",
      userId: "user_test_1",
      workspaceId: "ws_alpha",
    });

    expect(result.id).toBe("comp-winner-789");
    expect(result.status).toBe("running");
    // No pipeline scheduled for the loser, lock released with ownership token.
    expect(runComparisonJob).not.toHaveBeenCalled();
    expect(redisReleaseLock).toHaveBeenCalledWith(
      expect.objectContaining({ token: "mock-token-123" }),
    );
  });

  it("returns a retryable 409 when uniqueness conflicts but no winner is visible", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];
    mockComparisonsInsert.mockReturnValueOnce({
      values: vi.fn().mockRejectedValue(Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" })),
    });

    await expect(
      createComparisonJob({
        query: "Next.js vs Remix",
        userId: "user_test_1",
        workspaceId: "ws_alpha",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "COMPARISON_IN_PROGRESS",
    });

    expect(runComparisonJob).not.toHaveBeenCalled();
    expect(redisReleaseLock).toHaveBeenCalled();
  });

  it("rethrows non-unique insert failures without winner lookup", async () => {
    const { createComparisonJob } = await import("../sideby.js");

    mockSelectRows = [];
    mockComparisonsInsert.mockReturnValueOnce({
      values: vi.fn().mockRejectedValue(new Error("connection reset")),
    });

    await expect(
      createComparisonJob({
        query: "Next.js vs Remix",
        userId: "user_test_1",
      }),
    ).rejects.toThrow("connection reset");
  });
});
