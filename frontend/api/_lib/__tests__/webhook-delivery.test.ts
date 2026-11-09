import { EventEmitter } from "node:events";
import { beforeEach, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: deps.lookup }));
vi.mock("node:https", () => ({ request: deps.request }));

beforeEach(() => {
  vi.clearAllMocks();
  deps.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  deps.request.mockImplementation((_url, _options, respond) => {
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => respond({ statusCode: 302, destroy: vi.fn() });
    return request;
  });
});

it("rejects a public hostname resolving to a private address before sending data", async () => {
  const { deliverWebhook } = await import("../webhook-delivery.js");
  deps.lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
  await expect(deliverWebhook("https://example.com/hook", "{}", "signature")).rejects.toThrow(/public/);
  expect(deps.request).not.toHaveBeenCalled();
});

it("pins the checked DNS address and returns redirects without following them", async () => {
  const { deliverWebhook } = await import("../webhook-delivery.js");
  expect(await deliverWebhook("https://example.com/hook", "{}", "signature")).toBe(302);
  expect(deps.request).toHaveBeenCalledTimes(1);
  const options = deps.request.mock.calls[0][1];
  const pinned = vi.fn();
  options.lookup("example.com", {}, pinned);
  expect(pinned).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  expect(options.signal).toBeInstanceOf(AbortSignal);
  expect(options.agent).toBe(false);
});
