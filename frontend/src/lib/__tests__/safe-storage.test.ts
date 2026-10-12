// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";

import { safeSessionGet, safeSessionSet, safeSessionRemove } from "../safe-storage";

describe("safe-storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("round-trips values when storage works", () => {
    expect(safeSessionSet("k", "v")).toBe(true);
    expect(safeSessionGet("k")).toBe("v");
    safeSessionRemove("k");
    expect(safeSessionGet("k")).toBeNull();
  });

  it("reports failure instead of throwing on quota errors", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(safeSessionSet("k", "v")).toBe(false);
  });

  it("survives a throwing storage getter", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    try {
      expect(safeSessionGet("k")).toBeNull();
      expect(safeSessionSet("k", "v")).toBe(false);
      expect(() => safeSessionRemove("k")).not.toThrow();
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "sessionStorage", descriptor);
      } else {
        delete (window as unknown as Record<string, unknown>).sessionStorage;
      }
    }
  });
});
