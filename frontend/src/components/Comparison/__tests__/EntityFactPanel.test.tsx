/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { EntityFactPanel } from "../EntityFactPanel.js";
import type { ComparisonData } from "../types.js";

let memoizedState: Map<any, any> = new Map();

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof React>();
  return {
    ...original,
    useRef: (initial: any) => ({ current: initial }),
    useMemo: (fn: () => any, deps: any[]) => {
      // For unit test simplicity, execute the memoized function directly
      return fn();
    },
  };
});

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: () => {},
    from: () => {},
    fromTo: () => {},
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

describe("EntityFactPanel", () => {
  const mockResult = {
    entities: {
      a: { name: "React", hex: "#61dafb" },
      b: { name: "Vue", hex: "#42b883" },
    },
  } as unknown as ComparisonData;

  const mockFacts = {
    a: [
      { category: "Performance" },
      { category: "Ecosystem" },
      { category: "Community" },
    ],
    b: [
      { category: "Reactivity" },
      { category: "DX" },
    ],
  };

  it("renders EntityFactPanel element structure correctly", () => {
    const element = EntityFactPanel({ result: mockResult, facts: mockFacts });
    expect(element).not.toBeNull();
    expect(element.type).toBe("div");
  });

  it("handles empty facts object gracefully", () => {
    const element = EntityFactPanel({ result: mockResult, facts: {} });
    expect(element).not.toBeNull();
  });
});
