// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type * as safeStorage from "@/lib/safe-storage";

// Reloads are observed, never performed, in unit tests.
const { reloadSpy } = vi.hoisted(() => ({ reloadSpy: vi.fn() }));
vi.mock("@/lib/safe-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof safeStorage>();
  return { ...actual, reloadPage: reloadSpy };
});

import {
  pwaUpdates,
  resetPwaUpdatesForTests,
  DRAFT_STORAGE_KEY,
  DRAFT_SCHEMA_VERSION,
  type DraftScope,
} from "../register";

const SCOPE_A: DraftScope = { userId: "user_A", workspaceId: "ws_1", anonymous: false };
const SCOPE_A_OTHER_WS: DraftScope = { userId: "user_A", workspaceId: "ws_2", anonymous: false };
const SCOPE_B: DraftScope = { userId: "user_B", workspaceId: "ws_1", anonymous: false };
const SCOPE_ANON: DraftScope = { userId: null, workspaceId: null, anonymous: true };

const saveComposer = (scope: DraftScope, data = { entityA: "Next.js", entityB: "Remix", context: "SSR" }) => {
  const unregister = pwaUpdates.registerDraftSaver(() => ({ key: "composer", data, scope }));
  pwaUpdates.saveAllDrafts();
  unregister();
};

describe("PWA Draft Preservation System", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetPwaUpdatesForTests();
    vi.restoreAllMocks();
    reloadSpy.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
    resetPwaUpdatesForTests();
  });

  it("registers dirty checkers and correctly computes isDirty", () => {
    expect(pwaUpdates.isDirty()).toBe(false);

    const unregister = pwaUpdates.registerDirtyChecker(() => true);
    expect(pwaUpdates.isDirty()).toBe(true);

    unregister();
    expect(pwaUpdates.isDirty()).toBe(false);
  });

  it("restores a valid draft for the same account and workspace", () => {
    saveComposer(SCOPE_A);

    const restored = pwaUpdates.getPreservedDraft<{ entityA: string }>("composer", SCOPE_A);
    expect(restored?.entityA).toBe("Next.js");

    pwaUpdates.clearPreservedDraft("composer");
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();
  });

  it("does not leak account A's draft to account B in the same tab", () => {
    saveComposer(SCOPE_A);
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_B)).toBeNull();
    // A's draft is still intact for A.
    expect(pwaUpdates.getPreservedDraft<{ entityA: string }>("composer", SCOPE_A)?.entityA).toBe("Next.js");
  });

  it("does not leak across workspaces for the same user", () => {
    saveComposer(SCOPE_A);
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A_OTHER_WS)).toBeNull();
    expect(pwaUpdates.getPreservedDraft<{ entityA: string }>("composer", SCOPE_A)?.entityA).toBe("Next.js");
  });

  it("does not leak anonymous drafts into an authenticated session", () => {
    saveComposer(SCOPE_ANON);
    // User signs in as user_A: anonymous draft must not be adopted.
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();
    // Anonymous session still sees it until cleared or tab closes.
    expect(pwaUpdates.getPreservedDraft<{ entityA: string }>("composer", SCOPE_ANON)?.entityA).toBe("Next.js");
  });

  it("refuses to restore drafts when the scope is unresolved (null)", () => {
    saveComposer(SCOPE_A);
    expect(pwaUpdates.getPreservedDraft("composer", null)).toBeNull();
  });

  it("clears authenticated drafts on sign-out while preserving anonymous ones", () => {
    saveComposer(SCOPE_A);
    const unregisterAnon = pwaUpdates.registerDraftSaver(() => ({
      key: "bracket_composer",
      data: { rawOptions: "Option1\nOption2" },
      scope: SCOPE_ANON,
    }));
    pwaUpdates.saveAllDrafts();
    unregisterAnon();

    pwaUpdates.clearAuthenticatedDrafts();

    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();
    expect(
      pwaUpdates.getPreservedDraft<{ rawOptions: string }>("bracket_composer", SCOPE_ANON)?.rawOptions,
    ).toBe("Option1\nOption2");
  });

  it("discards legacy unscoped records and expired records", () => {
    const expired = Date.now() - 48 * 60 * 60 * 1000;
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        bad_version: { version: 99, createdAt: Date.now(), kind: "bad_version", scope: SCOPE_A, data: {} },
        expired: { version: 1, createdAt: expired, kind: "expired", scope: SCOPE_A, data: {} },
        mistyped: { notAnEnvelope: true },
        missing: null,
      }),
    );
    expect(pwaUpdates.getPreservedDraft("bad_version", SCOPE_A)).toBeNull();
    expect(pwaUpdates.getPreservedDraft("expired", SCOPE_A)).toBeNull();
    expect(pwaUpdates.getPreservedDraft("mistyped", SCOPE_A)).toBeNull();
    expect(pwaUpdates.getPreservedDraft("missing", SCOPE_A)).toBeNull();
  });

  it("validates payload fields and purges drafts with incorrect field types", () => {
    // 1. Composer draft with non-string entityA
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        composer: {
          version: DRAFT_SCHEMA_VERSION,
          createdAt: Date.now(),
          kind: "composer",
          scope: SCOPE_A,
          data: { entityA: 12345, entityB: "Remix", context: "SSR" },
        },
      }),
    );
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();
    // Verify it was purged from storage
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    // 2. Composer draft with unexpected extra fields
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        composer: {
          version: DRAFT_SCHEMA_VERSION,
          createdAt: Date.now(),
          kind: "composer",
          scope: SCOPE_A,
          data: { entityA: "Next.js", entityB: "Remix", context: "SSR", maliciousExtra: true },
        },
      }),
    );
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();

    // 3. Bracket composer with non-string rawOptions
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        bracket_composer: {
          version: DRAFT_SCHEMA_VERSION,
          createdAt: Date.now(),
          kind: "bracket_composer",
          scope: SCOPE_A,
          data: { rawOptions: ["Option 1", "Option 2"], context: "Evaluation" },
        },
      }),
    );
    expect(pwaUpdates.getPreservedDraft("bracket_composer", SCOPE_A)).toBeNull();

    // 4. Custom validator support
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        composer: {
          version: DRAFT_SCHEMA_VERSION,
          createdAt: Date.now(),
          kind: "composer",
          scope: SCOPE_A,
          data: { entityA: "Next.js", entityB: "Remix", context: "SSR" },
        },
      }),
    );
    const customValidator = (d: unknown): d is { entityA: string; entityB: string } => {
      return (d as { entityA: string }).entityA === "Specific";
    };
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A, customValidator)).toBeNull();
  });

  it("rejects invalid payload fields during saveAllDrafts", () => {
    const unregister = pwaUpdates.registerDraftSaver(() => ({
      key: "composer",
      // Invalid: entityA is a number instead of string
      data: { entityA: 99999 as unknown as string, entityB: "Remix" },
      scope: SCOPE_A,
    }));
    const result = pwaUpdates.saveAllDrafts();
    expect(result.ok).toBe(false);
    expect(result.failed).toEqual([{ key: "composer", reason: "invalid-payload-fields" }]);
    unregister();
  });

  it("recovers safely from malformed JSON in storage", () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, "{not-json");
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();
    const result = pwaUpdates.saveAllDrafts();
    expect(result.ok).toBe(true);
  });

  it("survives unavailable storage and throwing storage getters", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    try {
      expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).toBeNull();
      const result = pwaUpdates.saveAllDrafts();
      expect(result.ok).toBe(false);
      expect(result.failed).toEqual([{ key: "*", reason: "storage-unavailable" }]);
      expect(pwaUpdates.isDirty()).toBe(false);
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "sessionStorage", descriptor);
      } else {
        delete (window as unknown as Record<string, unknown>).sessionStorage;
      }
    }
  });

  it("reports quota failures instead of silently losing drafts", () => {
    saveComposer(SCOPE_A);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const unregister = pwaUpdates.registerDraftSaver(() => ({
      key: "bracket_composer",
      data: { rawOptions: "A" },
      scope: SCOPE_A,
    }));
    try {
      const result = pwaUpdates.saveAllDrafts();
      expect(result.ok).toBe(false);
      expect(result.failed.length).toBeGreaterThan(0);
    } finally {
      unregister();
      spy.mockRestore();
    }
  });

  it("preserves unrelated valid records when saving one form", () => {
    const unregisterBracket = pwaUpdates.registerDraftSaver(() => ({
      key: "bracket_composer",
      data: { rawOptions: "Svelte\nSolid" },
      scope: SCOPE_A,
    }));
    pwaUpdates.saveAllDrafts();
    unregisterBracket();

    // Only the composer saver is active now; the bracket record must survive.
    saveComposer(SCOPE_A);

    expect(
      pwaUpdates.getPreservedDraft<{ rawOptions: string }>("bracket_composer", SCOPE_A)?.rawOptions,
    ).toBe("Svelte\nSolid");
    expect(pwaUpdates.getPreservedDraft("composer", SCOPE_A)).not.toBeNull();
  });

  it("blocks automatic update when preservation fails while dirty", async () => {
    const unregisterSaver = pwaUpdates.registerDraftSaver(() => ({
      key: "composer",
      data: { entityA: "Dirty" },
      scope: SCOPE_A,
    }));
    const unregisterChecker = pwaUpdates.registerDirtyChecker(() => true);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    // A worker is registered: it must NOT be activated when saving failed.
    const workerSpy = vi.fn().mockResolvedValue(undefined);
    pwaUpdates.updateServiceWorker = workerSpy;
    try {
      const applied = await pwaUpdates.applyUpdate();
      expect(applied).toBe(false);
      expect(workerSpy).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    } finally {
      unregisterSaver();
      unregisterChecker();
      spy.mockRestore();
    }
  });

  it("snapshots drafts when applying an update and allows explicit discard", async () => {
    let mockUpdateWorkerCalled = false;
    pwaUpdates.updateServiceWorker = vi.fn().mockImplementation(async () => {
      mockUpdateWorkerCalled = true;
    });

    const unregister = pwaUpdates.registerDraftSaver(() => ({
      key: "bracket_composer",
      data: { rawOptions: "Svelte\nSolid\nVue" },
      scope: SCOPE_A,
    }));

    await pwaUpdates.applyUpdate();

    expect(mockUpdateWorkerCalled).toBe(true);
    // Activation owns the reload explicitly (no plugin auto-reload).
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    const restored = pwaUpdates.getPreservedDraft<{ rawOptions: string }>("bracket_composer", SCOPE_A);
    expect(restored?.rawOptions).toBe("Svelte\nSolid\nVue");

    // Explicit user-chosen discard path still activates the worker.
    const forced = await pwaUpdates.forceApplyUpdate();
    expect(forced).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(2);

    unregister();
  });
});
