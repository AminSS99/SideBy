import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const insertValuesMock = vi.fn().mockResolvedValue(undefined);
const insertMock = vi.fn(() => ({ values: insertValuesMock }));
const captureServerEventMock = vi.fn();
const tryGetAuthMock = vi.fn();
const checkRateLimitMock = vi.fn();

vi.mock("../../src/db/index.js", () => ({
  createDbClient: () => ({
    insert: insertMock,
  }),
}));

vi.mock("../_lib/analytics.js", () => ({
  captureServerEvent: (...args: unknown[]) => captureServerEventMock(...args),
}));

vi.mock("../_lib/auth.js", () => ({
  authenticateRequest: (...args: unknown[]) => tryGetAuthMock(...args),
  requireAuth: vi.fn(),
}));

vi.mock("../_lib/csrf.js", () => ({
  assertCsrfForRequest: vi.fn(),
}));

vi.mock("../_lib/rate-limit.js", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

import feedbackHandler from "./feedback.js";
import { listSelectableModels, resolveProviderForModelId } from "../_lib/providers/index.js";

function createMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    hasHeader() {
      return false;
    },
    setHeader() {
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
    send(payload: unknown) {
      body = payload;
      return this;
    },
    getStatus: () => statusCode,
    getBody: () => body,
  };
  return res as unknown as VercelResponse & { getStatus: () => number; getBody: () => unknown };
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tryGetAuthMock.mockResolvedValue({ userId: "user_123", orgId: "org_456" });
    checkRateLimitMock.mockResolvedValue({ allowed: true, remaining: 19, resetAt: 0 });
  });

  it("persists comparison rating feedback to Postgres and PostHog", async () => {
    const req = {
      method: "POST",
      body: {
        type: "comparison_rating",
        rating: 1,
        reasons: ["clear_verdict"],
        message: "Great source-backed breakdown!",
        comparisonId: "11111111-1111-4111-8111-111111111111",
        language: "az",
      },
      headers: {},
    } as unknown as VercelRequest;
    const res = createMockRes();

    await feedbackHandler(req, res);

    expect(res.getStatus()).toBe(201);
    expect(res.getBody()).toEqual({ ok: true });
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkUserId: "user_123",
        clerkOrgId: "org_456",
        eventType: "user_feedback",
        metadata: expect.objectContaining({
          type: "comparison_rating",
          rating: 1,
          reasons: ["clear_verdict"],
          message: "Great source-backed breakdown!",
          language: "az",
        }),
      }),
    );
    expect(captureServerEventMock).toHaveBeenCalledWith(
      "user_123",
      "user_feedback_submitted",
      expect.objectContaining({
        type: "comparison_rating",
        authenticated: true,
      }),
    );
  });

  it("rejects invalid rating values with 400", async () => {
    const req = {
      method: "POST",
      body: {
        type: "comparison_rating",
        rating: 99,
      },
      headers: {},
    } as unknown as VercelRequest;
    const res = createMockRes();

    await feedbackHandler(req, res);

    expect(res.getStatus()).toBe(400);
    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it("enforces rate limits with 429", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: 60 });
    const req = {
      method: "POST",
      body: { type: "general_feedback", message: "hello" },
      headers: {},
    } as unknown as VercelRequest;
    const res = createMockRes();

    await feedbackHandler(req, res);

    expect(res.getStatus()).toBe(429);
    expect(insertValuesMock).not.toHaveBeenCalled();
  });
});

describe("Multi-Model AI catalog & routing", () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("lists DeepSeek and Azure Foundry models when configured", () => {
    process.env.DEEPSEEK_API_KEY = "sk-deepseek-test";
    process.env.AZURE_OPENAI_API_KEY = "azure-test-key";
    process.env.AZURE_OPENAI_ENDPOINT = "https://snapeco1-resource.openai.azure.com/openai/v1";
    process.env.AZURE_OPENAI_DEPLOYMENT = "Llama-3.3-70B-Instruct";
    process.env.AZURE_OPENAI_MODELS = "Llama-3.3-70B-Instruct,Kimi-K2.5,Kimi-K2.6";

    const models = listSelectableModels();
    const ids = models.map((m) => m.id);

    expect(ids).toContain("auto");
    expect(ids).toContain("deepseek:deepseek-flash");
    expect(ids).toContain("azure:Llama-3.3-70B-Instruct");
    expect(ids).toContain("azure:Kimi-K2.5");
    expect(ids).toContain("azure:Kimi-K2.6");

    const resolved = resolveProviderForModelId("azure:Kimi-K2.6");
    expect(resolved.provider.name).toBe("azure");
    expect(resolved.model).toBe("Kimi-K2.6");
  });
});
