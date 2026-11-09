import { describe, expect, it, vi } from "vitest";
import { assertSafeWebhookUrl } from "../webhook-url.js";

describe("webhook destination validation", () => {
  it.each([
    "https://[::ffff:127.0.0.1]/", "https://[::ffff:10.0.0.1]/",
    "https://[::]/", "https://[fe90::1]/", "https://100.100.100.200/",
    "https://192.0.0.1/", "https://224.0.0.1/", "https://255.255.255.255/",
    "https://example.localhost./", "https://metadata.google.internal./",
  ])("rejects non-public destination %s", (url) => {
    expect(() => assertSafeWebhookUrl(url)).toThrow();
  });
  it.each(["https://example.com/hook", "https://8.8.8.8/hook", "https://[2606:4700:4700::1111]/"]) (
    "accepts public HTTPS destination %s", (url) => expect(() => assertSafeWebhookUrl(url)).not.toThrow(),
  );
  it("requires HTTPS in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    try { expect(() => assertSafeWebhookUrl("http://example.com")).toThrow(); }
    finally { vi.unstubAllEnvs(); }
  });
});
