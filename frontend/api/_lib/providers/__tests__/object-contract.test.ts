import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each(["deepseek", "openrouter"] as const)("%s sends the required fact schema to the model before generation", async (provider) => {
  vi.resetModules();
  vi.stubEnv("DEEPSEEK_API_KEY", "test-only");
  vi.stubEnv("OPENROUTER_API_KEY", "test-only");
  const calls: Array<{ messages: Array<{ role: string; content: string }> }> = [];
  const fact = { entity: "React", dimension: "License", value: "MIT", confidence: 0.9 };
  vi.stubGlobal("fetch", async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push(body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ facts: [fact] }) } }] }));
  });
  const adapter = provider === "deepseek"
    ? new (await import("../deepseek.js")).DeepSeekAdapter()
    : new (await import("../openrouter.js")).OpenRouterAdapter();
  const result = await adapter.generateObject([{ role: "user", content: "Extract sourced facts." }], z.array(z.object({
    entity: z.string(), dimension: z.string(), value: z.string(), confidence: z.number().min(0).max(1),
  })));
  expect(result.data).toEqual([fact]);
  const contract = calls[0].messages.find((message) => message.role === "system" && message.content.includes('"required"'))?.content || "";
  expect(contract).toContain('"confidence"');
  expect(contract).toContain('"value"');
  expect(contract).toContain('"maximum":1');
});
