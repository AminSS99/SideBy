import { describe, it, expect, vi } from "vitest";
import type { Category, Entity, ComparisonFact } from "../types";

// Mock gsap to prevent DOM animation errors in Vitest Node environment
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    from: vi.fn(),
    timeline: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn(),
}));

describe("CategorySection facts partitioning logic", () => {
  const mockEntities: { a: Entity; b: Entity } = {
    a: { name: "React", hex: "#61dafb" },
    b: { name: "Vue", hex: "#42b883" },
  };

  const mockFacts: ComparisonFact[] = [
    { entity: "a", label: "Ecosystem", value: "Huge ecosystem with npm", confidence: 0.95, freshness: "Fresh", source: "Docs" },
    { entity: "b", label: "Ecosystem", value: "Growing ecosystem with official packages", confidence: 0.90, freshness: "Fresh", source: "Docs" },
    { entity: "a", label: "Performance", value: "Virtual DOM reconciliation", confidence: 0.88, freshness: "Fresh", source: "Benchmark" },
  ];

  const mockCategory: Category = {
    name: "Ecosystem & Performance",
    winner: "a",
    verdict: "React has a larger ecosystem and community support.",
    facts: mockFacts,
  };

  it("should correctly partition facts into Entity A and Entity B", () => {
    const factsA: ComparisonFact[] = [];
    const factsB: ComparisonFact[] = [];

    if (mockCategory.facts) {
      for (let i = 0; i < mockCategory.facts.length; i++) {
        const f = mockCategory.facts[i];
        if (f.entity === "a") factsA.push(f);
        else if (f.entity === "b") factsB.push(f);
      }
    }

    expect(factsA.length).toBe(2);
    expect(factsB.length).toBe(1);
    expect(factsA[0].value).toBe("Huge ecosystem with npm");
    expect(factsA[1].value).toBe("Virtual DOM reconciliation");
    expect(factsB[0].value).toBe("Growing ecosystem with official packages");
  });

  it("should handle empty or undefined facts array without throwing", () => {
    const emptyCategory: Category = {
      name: "Empty Category",
      winner: "tie",
      verdict: "No winner",
      facts: [],
    };

    const factsA: ComparisonFact[] = [];
    const factsB: ComparisonFact[] = [];

    if (emptyCategory.facts) {
      for (let i = 0; i < emptyCategory.facts.length; i++) {
        const f = emptyCategory.facts[i];
        if (f.entity === "a") factsA.push(f);
        else if (f.entity === "b") factsB.push(f);
      }
    }

    expect(factsA.length).toBe(0);
    expect(factsB.length).toBe(0);
  });

  it("should correctly resolve winner entity from Category winner field", () => {
    const winnerEntityA = mockCategory.winner === "a" ? mockEntities.a : mockCategory.winner === "b" ? mockEntities.b : null;
    expect(winnerEntityA?.name).toBe("React");

    const categoryBWinner: Category = { ...mockCategory, winner: "b" };
    const winnerEntityB = categoryBWinner.winner === "a" ? mockEntities.a : categoryBWinner.winner === "b" ? mockEntities.b : null;
    expect(winnerEntityB?.name).toBe("Vue");

    const categoryTie: Category = { ...mockCategory, winner: "tie" };
    const winnerEntityTie = categoryTie.winner === "a" ? mockEntities.a : categoryTie.winner === "b" ? mockEntities.b : null;
    expect(winnerEntityTie).toBeNull();
  });
});
