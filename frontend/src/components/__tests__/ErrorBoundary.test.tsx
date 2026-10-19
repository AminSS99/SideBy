// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

import GlobalErrorBoundary from "../ErrorBoundary";
import { CHUNK_RELOAD_GUARD_KEY } from "@/lib/safe-storage";
import * as safeStorage from "@/lib/safe-storage";

// Observe reloads without navigating: keep every other helper real.
const { reloadSpy } = vi.hoisted(() => ({ reloadSpy: vi.fn() }));
vi.mock("@/lib/safe-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof safeStorage>();
  return { ...actual, reloadPage: reloadSpy };
});

function ChunkBoom(): React.JSX.Element {
  throw new Error("failed to fetch dynamically imported module: chunk-abc.js");
}

function RuntimeBoom(): React.JSX.Element {
  throw new Error("ordinary render failure");
}

// React logs caught errors to console.error; silence them for these tests.
let consoleSpy: ReturnType<typeof vi.spyOn>;

describe("GlobalErrorBoundary chunk auto-recovery", () => {
  beforeEach(() => {
    reloadSpy.mockClear();
    sessionStorage.clear();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
  });

  afterEach(() => {
    cleanup();
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("auto-reloads once and records the guard when storage works", () => {
    render(
      <MemoryRouter>
        <GlobalErrorBoundary>
          <ChunkBoom />
        </GlobalErrorBoundary>
      </MemoryRouter>,
    );

    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBe("true");
    expect(screen.getByText("Update available")).toBeTruthy();
  });

  it("does NOT auto-reload when the guard cannot be persisted", () => {
    // Blocked storage: the guard write fails, so the next page load would
    // have no record of this attempt and could reload again.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    render(
      <MemoryRouter>
        <GlobalErrorBoundary>
          <ChunkBoom />
        </GlobalErrorBoundary>
      </MemoryRouter>,
    );

    expect(reloadSpy).not.toHaveBeenCalled();
    // The error surface stays up with an explicit user Reload action.
    expect(screen.getByText("Update available")).toBeTruthy();
    expect(screen.getByText("Reload")).toBeTruthy();
  });

  it("does not auto-reload a second time once the guard exists", () => {
    sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "true");

    render(
      <MemoryRouter>
        <GlobalErrorBoundary>
          <ChunkBoom />
        </GlobalErrorBoundary>
      </MemoryRouter>,
    );

    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("never auto-reloads non-chunk errors", () => {
    render(
      <MemoryRouter>
        <GlobalErrorBoundary>
          <RuntimeBoom />
        </GlobalErrorBoundary>
      </MemoryRouter>,
    );

    expect(reloadSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});
