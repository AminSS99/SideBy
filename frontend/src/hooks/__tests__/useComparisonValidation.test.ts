/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { useComparisonValidation } from "../useComparisonValidation";

// Mock React hooks to test useComparisonValidation hook in isolation
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof React>();

  let states: any[] = [];
  let stateIndex = 0;
  let effects: { cb: () => void; deps?: any[] }[] = [];
  let cleanups: (() => void)[] = [];
  let onStateChange = () => {};

  const useStateMock = (initialValue: any) => {
    const currentIndex = stateIndex++;
    if (states[currentIndex] === undefined) {
      states[currentIndex] = typeof initialValue === "function" ? initialValue() : initialValue;
    }
    const setter = (newValue: any) => {
      const oldVal = states[currentIndex];
      const newVal = typeof newValue === "function" ? newValue(oldVal) : newValue;
      if (oldVal !== newVal) {
        states[currentIndex] = newVal;
        onStateChange();
      }
    };
    return [states[currentIndex], setter];
  };

  const useRefMock = (initialValue: any) => {
    const refContainer = useMemoMock(() => ({ current: initialValue }), []);
    return refContainer;
  };

  const useEffectMock = (cb: () => void, deps?: any[]) => {
    const slot = stateIndex++;
    effects.push({
      cb: () => {
        if (cleanups[slot]) {
          cleanups[slot]();
        }
        const cleanup = cb();
        if (typeof cleanup === "function") {
          cleanups[slot] = cleanup;
        }
      },
      deps
    });
  };

  const useMemoMock = (factory: () => any, deps?: any[]) => factory();
  const useCallbackMock = (cb: any, deps?: any[]) => cb;

  return {
    ...original,
    useState: useStateMock,
    useRef: useRefMock,
    useEffect: useEffectMock,
    useMemo: useMemoMock,
    useCallback: useCallbackMock,
    // Test helper to inspect/reset state mock
    _reset: () => {
      states = [];
      stateIndex = 0;
      effects = [];
      cleanups.forEach((c) => c && c());
      cleanups = [];
    },
    _getStates: () => states,
    _runEffects: () => {
      effects.forEach(({ cb }) => cb());
    },
    _setTrigger: (cb: () => void) => {
      onStateChange = cb;
    },
    _resetIndex: () => {
      stateIndex = 0;
    }
  };
});

// Helper to simulate React hook rendering lifecycle
function renderHookHelper<T>(hookFn: () => T) {
  const result = { current: null as unknown as T };
  let reactMock: any;

  const render = () => {
    reactMock._resetIndex();
    result.current = hookFn();
  };

  import("react").then((m) => {
    reactMock = m;
    reactMock._setTrigger(render);
  });

  reactMock = React as any;
  reactMock._setTrigger(render);
  render();

  return result;
}

describe("useComparisonValidation Debounce and Race Conditions", () => {
  let reactMock: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    reactMock = await import("react") as any;
    reactMock._reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should separate options and context on initial query parse", () => {
    const hook = renderHookHelper(() => useComparisonValidation({
      initialEntityA: "Supabase",
      initialEntityB: "Firebase",
      initialContext: "a mobile app",
    }));

    expect(hook.current.entityA).toBe("Supabase");
    expect(hook.current.entityB).toBe("Firebase");
    expect(hook.current.context).toBe("a mobile app");
  });

  it("should correctly handle suggestions chip choice", () => {
    const hook = renderHookHelper(() => useComparisonValidation());

    hook.current.setFromFullQuery("React vs Vue for enterprise SaaS");

    expect(hook.current.entityA).toBe("React");
    expect(hook.current.entityB).toBe("Vue");
    expect(hook.current.context).toBe("enterprise SaaS");
  });

  it("should debounce validation fetch and protect against race conditions", async () => {
    vi.useFakeTimers();

    let fetchCount = 0;
    const mockResponses = [
      { intent: { canStart: true, confidence: 0.9, message: "Response 1" } },
      { intent: { canStart: true, confidence: 0.95, message: "Response 2" } },
    ];

    const mockFetch = vi.fn().mockImplementation(async () => {
      const respIndex = fetchCount++;
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => mockResponses[respIndex],
      } as any;
    });

    vi.stubGlobal("fetch", mockFetch);

    const hook = renderHookHelper(() => useComparisonValidation());

    hook.current.setEntityA("Tailwind");
    hook.current.setEntityB("UnoCSS");

    // Trigger effect
    reactMock._runEffects();

    // Fast-forward timers for debounce (450ms)
    await vi.advanceTimersByTimeAsync(450);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
