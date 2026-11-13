import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const deps = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getComparisonJob: vi.fn(),
  loadPublishEvidence: vi.fn(),
  assessPublishEligibility: vi.fn(),
  createDbClient: vi.fn(() => ({})),
  withRateLimit: vi.fn(),
}));

vi.mock("../../_lib/auth.js", () => ({
  requireAuth: deps.requireAuth,
}));

vi.mock("../../_lib/sideby.js", () => ({
  getComparisonJob: deps.getComparisonJob,
  loadPublishEvidence: deps.loadPublishEvidence,
  sendJson: (res: VercelResponse, payload: unknown, status = 200) =>
    res.status(status).json(payload),
}));

vi.mock("../../_lib/public-eligibility.js", () => ({
  assessPublishEligibility: deps.assessPublishEligibility,
}));

vi.mock("../../../src/db/index.js", () => ({
  createDbClient: deps.createDbClient,
}));

vi.mock("../../_lib/route-guard.js", () => ({
  withRateLimit: deps.withRateLimit,
}));

vi.mock("../../_lib/db-auth.js", () => ({
  canAccessComparison: vi.fn(),
}));

vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn(),
}));

vi.mock("../../_lib/job-engine.js", () => ({
  drainQueuedComparisonJobs: vi.fn(async () => ({ scanned: 0, due: 0, started: 0 })),
}));

import handler from "./[id].js";

async function runGet(id = "cmp_123") {
  let status = 200;
  let body: unknown;
  const res = {
    status: (code: number) => {
      status = code;
      return res;
    },
    json: (payload: unknown) => {
      body = payload;
      return res;
    },
  };
  const req = {
    method: "GET",
    query: { id },
    headers: {},
  } as unknown as VercelRequest;

  await handler(req, res as unknown as VercelResponse);
  return { status, body };
}

describe("GET /api/comparisons/:id polling optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.requireAuth.mockResolvedValue({ userId: "user_1" });
  });

  it("skips loadPublishEvidence while comparison is still running", async () => {
    deps.getComparisonJob.mockResolvedValueOnce({
      id: "cmp_123",
      status: "running",
      progress: 40,
      result: null,
    });

    const res = await runGet();
    expect(res.status).toBe(200);
    expect(deps.loadPublishEvidence).not.toHaveBeenCalled();
    expect(deps.createDbClient).not.toHaveBeenCalled();
    expect((res.body as { publishEligibility: { eligible: boolean; classification: string } }).publishEligibility).toEqual({
      eligible: false,
      classification: "incomplete",
      reasons: ["Research has not finished yet."],
    });
  });

  it("loads publish evidence once comparison is completed with a result", async () => {
    deps.getComparisonJob.mockResolvedValueOnce({
      id: "cmp_123",
      status: "completed",
      progress: 100,
      result: { title: "A vs B" },
    });
    deps.loadPublishEvidence.mockResolvedValueOnce({ sourceCount: 4 });
    deps.assessPublishEligibility.mockReturnValueOnce({
      eligible: true,
      classification: "ready",
      reasons: [],
    });

    const res = await runGet();
    expect(res.status).toBe(200);
    expect(deps.loadPublishEvidence).toHaveBeenCalledTimes(1);
    expect(deps.assessPublishEligibility).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthenticated POST feedback with 401 before calling withRateLimit", async () => {
    deps.requireAuth.mockRejectedValueOnce(
      Object.assign(new Error("Authentication required."), { statusCode: 401 }),
    );
    let status = 200;
    const res = {
      status: (code: number) => {
        status = code;
        return res;
      },
      json: () => res,
    };
    const req = {
      method: "POST",
      query: { id: "cmp_123" },
      body: { rating: 5 },
      headers: {},
    } as unknown as VercelRequest;

    await handler(req, res as unknown as VercelResponse);
    expect(status).toBe(401);
    expect(deps.withRateLimit).not.toHaveBeenCalled();
  });
});
