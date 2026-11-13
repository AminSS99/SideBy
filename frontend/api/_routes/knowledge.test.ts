import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const deps = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  withRateLimit: vi.fn(),
  checkRateLimit: vi.fn(),
  searchKnowledgeChunks: vi.fn(),
}));

vi.mock("../_lib/auth.js", () => ({
  requireAuth: deps.requireAuth,
}));

vi.mock("../_lib/route-guard.js", () => ({
  withRateLimit: deps.withRateLimit,
}));

vi.mock("../_lib/rate-limit.js", () => ({
  checkRateLimit: deps.checkRateLimit,
}));

vi.mock("../../src/db/index.js", () => ({
  createDbClient: () => ({}),
}));

vi.mock("../_lib/knowledge.js", () => ({
  KnowledgeApiError: class extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  assertKnowledgeScopeAccess: vi.fn(),
  getKnowledgeDocumentForMutation: vi.fn(),
  listKnowledgeDocuments: vi.fn(),
  markKnowledgeDocumentError: vi.fn(),
  persistKnowledgeChunks: vi.fn(),
  searchKnowledgeChunks: deps.searchKnowledgeChunks,
  toKnowledgeDocumentDto: vi.fn(),
}));

vi.mock("../_lib/knowledge-processing.js", () => ({
  KnowledgeProcessingError: class extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  buildKnowledgeBlobKey: vi.fn(),
  chunkKnowledgeText: vi.fn(),
  extractTextFromKnowledgeFile: vi.fn(),
  getKnowledgeMaxUploadBytes: () => 5 * 1024 * 1024,
  validateKnowledgeFile: vi.fn(),
}));

vi.mock("../_lib/sideby.js", () => ({
  sendJson: (res: VercelResponse, payload: unknown, status = 200) =>
    res.status(status).json(payload),
}));

vi.mock("../_lib/analytics.js", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("../_lib/env.js", () => ({
  serverEnv: { blobReadWriteToken: "" },
}));

import handler from "./knowledge.js";

function makeRes() {
  let status = 200;
  let body: unknown;
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    status: (code: number) => {
      status = code;
      return res;
    },
    json: (payload: unknown) => {
      body = payload;
      return res;
    },
  };
  return { res: res as unknown as VercelResponse, result: () => ({ status, body, headers }) };
}

describe("knowledge API safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects unauthenticated uploads with 401 before calling withRateLimit", async () => {
    deps.requireAuth.mockRejectedValueOnce(
      Object.assign(new Error("Authentication required."), { statusCode: 401 }),
    );
    const { res, result } = makeRes();
    const req = {
      method: "POST",
      query: { action: "upload" },
      headers: {},
    } as unknown as VercelRequest;

    await handler(req, res);
    expect(result().status).toBe(401);
    expect(deps.withRateLimit).not.toHaveBeenCalled();
  });

  it("rate-limits knowledge vector search requests before calling searchKnowledgeChunks", async () => {
    deps.requireAuth.mockResolvedValueOnce({ userId: "user_1" });
    deps.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      resetAt: Date.now() + 25_000,
    });

    const { res, result } = makeRes();
    const req = {
      method: "POST",
      query: { action: "search" },
      headers: {},
      body: {
        query: "compare pricing tiers",
        workspaceId: "00000000-0000-4000-8000-000000000001",
      },
    } as unknown as VercelRequest;

    await handler(req, res);
    const out = result();
    expect(out.status).toBe(429);
    expect(out.headers["Retry-After"]).toBeDefined();
    expect(deps.searchKnowledgeChunks).not.toHaveBeenCalled();
  });
});
