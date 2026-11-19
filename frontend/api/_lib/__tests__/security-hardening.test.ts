import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";
import type { VercelRequest } from "@vercel/node";
import {
  comparisonCache,
  publicComparisonCacheKey,
  userComparisonCacheKey,
} from "../cache-layer.js";
import { collectTranslatableSlots } from "../result-translation.js";
import { readRawBody } from "../dodo.js";

describe("Tenant cache key isolation", () => {
  it("isolates per-user cached comparisons from other tenants and public cache", () => {
    const slug = `tenant-isolation-${Date.now()}`;
    const privateResult = { slug, query: "AWS vs GCP for confidential Acme deal" };

    comparisonCache.set(userComparisonCacheKey("user_a", slug), privateResult, 60_000);

    expect(comparisonCache.get(userComparisonCacheKey("user_a", slug))).toEqual(privateResult);
    expect(comparisonCache.get(userComparisonCacheKey("user_b", slug))).toBeNull();
    expect(comparisonCache.get(publicComparisonCacheKey(slug))).toBeNull();
  });
});

describe("Result translation slot bounds", () => {
  it("caps translatable slots at 200 to bound LLM fan-out", () => {
    const oversizedResult = {
      categories: [
        {
          name: "Category",
          verdict: "Verdict",
          facts: Array.from({ length: 150 }, (_, index) => ({
            label: `Label ${index}`,
            value: `Value ${index}`,
            previousValue: `Prev ${index}`,
          })),
        },
      ],
    };

    const slots = collectTranslatableSlots(oversizedResult);
    expect(slots.length).toBe(200);
  });
});

describe("Dodo webhook raw body size bound", () => {
  it("rejects payloads exceeding the maximum byte limit with 413", async () => {
    const stream = Readable.from([Buffer.alloc(2048, "a")]) as unknown as VercelRequest;
    await expect(readRawBody(stream, 1024)).rejects.toMatchObject({
      statusCode: 413,
    });
  });

  it("reads payloads within the limit", async () => {
    const stream = Readable.from([Buffer.from('{"ok":true}')]) as unknown as VercelRequest;
    await expect(readRawBody(stream, 1024)).resolves.toBe('{"ok":true}');
  });
});

describe("Export engine sanitization & tenant scoping", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws 404 when caller cannot access the comparison", async () => {
    vi.doMock("../db-auth.js", () => ({
      canAccessComparison: vi.fn().mockResolvedValue(false),
      canAccessWorkspace: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock("../../../src/db/index.js", () => ({
      createDbClient: () => ({}),
    }));

    const { exportComparison } = await import("../export-engine.js");
    await expect(exportComparison("cmp_1", "user_stranger", "json")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("redacts internal DB fields and omits questions for non-members on public comparisons", async () => {
    const selectResults = [
      [{
        id: "cmp_pub",
        query: "React vs Vue",
        slug: "react-vs-vue",
        status: "completed",
        visibility: "public",
        clerkUserId: "user_owner",
        clerkOrgId: "org_secret",
        workspaceId: "ws_owner",
        intentKey: "secret-intent",
        queryEmbedding: [0.1, 0.2],
        totalCost: "0.42",
        errorMessage: "internal error",
        sourceCount: 1,
        factsCount: 1,
        dimensionsCount: 0,
        overallConfidence: "0.9",
        freshnessClass: "product",
        taxonomyCategory: "software",
        result: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      }],
      [], // entities
      [], // dimensions
      [{ title: "Evil [link]", url: "javascript:alert(1)", reliability: "Community" }], // sources
      [{ id: "f1", value: "Fact 1", confidence: "0.9", embedding: [0.1, 0.2] }], // facts
      [], // scores
      [], // verdict
    ];
    let idx = 0;
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            const rows = selectResults[idx++] ?? [];
            return Object.assign(Promise.resolve(rows), {
              limit: async () => rows,
            });
          },
        }),
      }),
    };

    vi.doMock("../db-auth.js", () => ({
      canAccessComparison: vi.fn().mockResolvedValue(true),
      canAccessWorkspace: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock("../../../src/db/index.js", () => ({
      createDbClient: () => mockDb,
    }));

    const { exportComparison } = await import("../export-engine.js");
    const jsonExport = await exportComparison("cmp_pub", "user_stranger", "json");
    expect("comparison" in jsonExport).toBe(true);
    if ("comparison" in jsonExport) {
      expect(jsonExport.comparison).not.toHaveProperty("clerkUserId");
      expect(jsonExport.comparison).not.toHaveProperty("clerkOrgId");
      expect(jsonExport.comparison).not.toHaveProperty("intentKey");
      expect(jsonExport.comparison).not.toHaveProperty("queryEmbedding");
      expect(jsonExport.comparison).not.toHaveProperty("totalCost");
      expect(jsonExport.questions).toEqual([]);
      expect(jsonExport.facts[0]).not.toHaveProperty("embedding");
    }

    idx = 0;
    const mdExport = await exportComparison("cmp_pub", "user_stranger", "markdown");
    if ("markdown" in mdExport) {
      expect(mdExport.markdown).not.toContain("javascript:alert(1)");
    }
  });
});

describe("Refresh engine authorization status codes", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws 403 when caller cannot mutate the comparison", async () => {
    vi.doMock("../db-auth.js", () => ({
      canMutateComparison: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock("../../../src/db/index.js", () => ({
      createDbClient: () => ({}),
    }));

    const { queueComparisonRefresh } = await import("../refresh-engine.js");
    await expect(queueComparisonRefresh("cmp_1", "user_stranger")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe("Email HTML escaping", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("escapes HTML in user name and query before sending email", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_1" }),
    });
    const originalFetch = global.fetch;
    global.fetch = mockFetch;

    vi.doMock("../../../src/db/index.js", () => ({
      createDbClient: () => ({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [{ email: "user@example.com", name: '<script>alert("x")</script>' }],
            }),
          }),
        }),
      }),
    }));

    try {
      const { sendComparisonCompleteEmail } = await import("../email.js");
      await sendComparisonCompleteEmail({
        userId: "user_1",
        comparisonId: "cmp_1",
        query: '<img src=x onerror=alert(1)> vs Vue',
        slug: "test",
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string) as { html: string };
      expect(sentBody.html).not.toContain("<script>");
      expect(sentBody.html).not.toContain("<img ");
      expect(sentBody.html).toContain("&lt;script&gt;");
      expect(sentBody.html).toContain("&lt;img ");
    } finally {
      global.fetch = originalFetch;
      vi.unstubAllEnvs();
    }
  });
});

describe("Firecrawl SSRF guard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("blocks private/internal URLs before calling Firecrawl fetch", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "fc_test_key");
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;
    global.fetch = mockFetch;

    try {
      const { extractPage } = await import("../firecrawl.js");
      const result = await extractPage("http://169.254.169.254/latest/meta-data/");
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
      vi.unstubAllEnvs();
    }
  });
});
