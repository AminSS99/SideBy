// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type * as safeStorage from "@/lib/safe-storage";

// Reloads are observed, never performed, in unit tests.
const { reloadSpy } = vi.hoisted(() => ({ reloadSpy: vi.fn() }));
vi.mock("@/lib/safe-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof safeStorage>();
  return { ...actual, reloadPage: reloadSpy };
});

import { pwaUpdates, initServiceWorker, forceRegisterForTests, resetPwaUpdatesForTests } from "../register";

describe("service worker registration", () => {
  beforeEach(() => {
    resetPwaUpdatesForTests();
    vi.restoreAllMocks();
    reloadSpy.mockClear();
  });

  afterEach(() => {
    resetPwaUpdatesForTests();
  });

  it("resolves the PWA registration adapter through the test boundary", async () => {
    const adapter = await import("virtual:pwa-register");
    expect(typeof adapter.registerSW).toBe("function");
  });

  it("is a safe no-op outside production builds", async () => {
    // Vitest runs with import.meta.env.PROD === false.
    await expect(initServiceWorker()).resolves.toBeUndefined();
    expect(pwaUpdates.updateServiceWorker).toBeNull();
  });

  it("leaves the app shell usable when registration state is absent", async () => {
    // No worker registered and nothing dirty: update falls back to reload
    // semantics only when asked — mere absence must not throw.
    expect(pwaUpdates.needRefresh).toBe(false);
    expect(pwaUpdates.offlineReady).toBe(false);
    expect(() => pwaUpdates.dismissUpdate()).not.toThrow();
  });

  it("activates the registered worker on update and reloads explicitly", async () => {
    const worker = vi.fn().mockResolvedValue(undefined);
    forceRegisterForTests(() => worker);
    const applied = await pwaUpdates.applyUpdate();
    expect(applied).toBe(true);
    expect(worker).toHaveBeenCalledWith(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("reports update activation failures without throwing", async () => {
    const worker = vi.fn().mockRejectedValue(new Error("activation failed"));
    forceRegisterForTests(() => worker);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const applied = await pwaUpdates.applyUpdate();
      expect(applied).toBe(false);
      expect(reloadSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
