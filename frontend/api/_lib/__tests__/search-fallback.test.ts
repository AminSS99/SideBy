import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../redis.js", () => ({
  redisGet: vi.fn(async () => null),
  redisSet: vi.fn(async () => undefined),
}));
vi.mock("../log.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("search provider fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.TAVILY_API_KEY = "tavily-test";
    process.env.EXA_API_KEY = "exa-test";
    process.env.TINYFISH_API_KEY = "tf-test";
  });

  it("uses Exa when Tavily fails, then TinyFish when Exa fails too", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(new URL(url).host);
      if (url.includes("tavily")) return new Response("quota", { status: 432 });
      if (url.includes("exa.ai")) return new Response("down", { status: 503 });
      return ok({ results: [{ title: "T", url: "https://example.com/a?utm_source=x", snippet: "s", position: 1 }] });
    }));
    const { searchTavily } = await import("../search.js");
    const results = await searchTavily({ query: "a vs b" });
    expect(calls).toEqual(["api.tavily.com", "api.exa.ai", "api.search.tinyfish.ai"]);
    expect(results[0].url).toBe("https://example.com/a");
  });

  it("stops at the first provider that answers", async () => {
    const fetchMock = vi.fn(async () => ok({ results: [{ title: "T", url: "https://x.dev/", content: "c", score: 0.9 }] }));
    vi.stubGlobal("fetch", fetchMock);
    const { searchTavily } = await import("../search.js");
    await searchTavily({ query: "c vs d" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when every provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    const { searchTavily } = await import("../search.js");
    await expect(searchTavily({ query: "e vs f" })).rejects.toThrow(/All search providers failed/);
  });
});
