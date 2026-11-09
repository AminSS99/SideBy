import type { VercelRequest, VercelResponse } from "@vercel/node";
import { expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ extract: vi.fn(), admit: false }));
vi.mock("../_lib/auth.js", () => ({ requireAuth: async () => ({ userId: "test-user" }) }));
vi.mock("../_lib/firecrawl.js", () => ({ extractPage: deps.extract }));
vi.mock("../_lib/analytics.js", () => ({ captureServerEvent: vi.fn() }));
vi.mock("../_lib/route-guard.js", () => ({ withRateLimit: async (_req: unknown, res: VercelResponse, _action: unknown, work: () => Promise<unknown>) => deps.admit ? work() : res.status(429).json({ error: "Rate limited" }) }));
vi.mock("../_lib/sideby.js", () => ({ sendJson: (res: VercelResponse, data: unknown, status = 200) => res.status(status).json(data) }));
import handler from "./comparison-context.js";

it("rejects exhausted imports before calling the paid extraction service", async () => {
  let status = 0;
  const res = { status: (value: number) => { status = value; return res; }, json: vi.fn() } as unknown as VercelResponse;
  await handler({ method: "POST", body: { url: "https://example.com/requirements" } } as VercelRequest, res);
  expect(status).toBe(429);
  expect(deps.extract).not.toHaveBeenCalled();
});
