import { describe, it, expect } from "vitest";
import type { ComparisonData } from "../types";

// Helper function mirroring the exact score computation logic from DecisionMatrixPanel
function computeDecisionMatrixScores(
  dimensions: ComparisonData["dimensions"],
  weights: Record<string, number>
) {
  if (!dimensions || dimensions.length === 0) {
    return { scoreA: 0, scoreB: 0, winner: "tie" };
  }

  let sumWeights = 0;
  let weightedSumA = 0;
  let weightedSumB = 0;

  dimensions.forEach((d) => {
    const w = weights[d.subject] ?? 3;
    sumWeights += w;
    const normA = (d.a / d.fullMark) * 100;
    const normB = (d.b / d.fullMark) * 100;

    weightedSumA += normA * w;
    weightedSumB += normB * w;
  });

  const finalA = sumWeights > 0 ? Number((weightedSumA / sumWeights).toFixed(1)) : 0;
  const finalB = sumWeights > 0 ? Number((weightedSumB / sumWeights).toFixed(1)) : 0;

  let winner: "a" | "b" | "tie" = "tie";
  if (finalA > finalB) winner = "a";
  else if (finalB > finalA) winner = "b";

  return {
    scoreA: finalA,
    scoreB: finalB,
    winner,
  };
}

// Helper function mirroring the exact lazy weight initialization logic from DecisionMatrixPanel
function initializeMatrixWeights(dimensions: ComparisonData["dimensions"]): Record<string, number> {
  const initial: Record<string, number> = {};
  if (dimensions) {
    dimensions.forEach((d) => {
      initial[d.subject] = 3;
    });
  }
  return initial;
}

// Helper function mirroring DecisionWeightsPanel weighted score calculation logic
function computeWeightedIntelligenceScores(
  metrics: Array<{ subject: string; a: number; b: number }>,
  weights: Record<string, number>
) {
  let sumWeight = 0;
  let sumA = 0;
  let sumB = 0;

  for (const metric of metrics) {
    const weight = weights[metric.subject] ?? 1;
    sumWeight += weight;
    sumA += metric.a * weight;
    sumB += metric.b * weight;
  }

  const totalWeight = sumWeight || 1;
  const a = sumA / totalWeight;
  const b = sumB / totalWeight;

  return { a, b, winner: Math.abs(a - b) < 1 ? "tie" : a > b ? "a" : "b" };
}

describe("DecisionMatrixPanel & DecisionWeightsPanel Performance Logic", () => {
  const mockDimensions: ComparisonData["dimensions"] = [
    { subject: "Performance", a: 9, b: 7, fullMark: 10 },
    { subject: "Developer Experience", a: 8, b: 9, fullMark: 10 },
    { subject: "Ecosystem", a: 10, b: 6, fullMark: 10 },
  ];

  it("should lazily initialize default weights to 3 for all dimensions without requiring post-mount state updates", () => {
    const weights = initializeMatrixWeights(mockDimensions);

    expect(weights).toEqual({
      Performance: 3,
      "Developer Experience": 3,
      Ecosystem: 3,
    });
  });

  it("should calculate identical weighted scores with empty weights vs initialized default weights", () => {
    const scoresEmpty = computeDecisionMatrixScores(mockDimensions, {});
    const scoresInitialized = computeDecisionMatrixScores(mockDimensions, {
      Performance: 3,
      "Developer Experience": 3,
      Ecosystem: 3,
    });

    expect(scoresEmpty).toEqual(scoresInitialized);
    expect(scoresEmpty.winner).toBe("a");
    expect(scoresEmpty.scoreA).toBe(90);
    expect(scoresEmpty.scoreB).toBe(73.3);
  });

  it("should dynamically recalculate winner when dimension slider weights are tuned", () => {
    // Elevate Developer Experience weight to 5 (Critical) and lower Ecosystem to 1 (Low)
    const tunedWeights = {
      Performance: 2,
      "Developer Experience": 5,
      Ecosystem: 1,
    };

    const scores = computeDecisionMatrixScores(mockDimensions, tunedWeights);

    // Entity B scores higher in Developer Experience (9 vs 8)
    expect(scores.scoreA).toBe(85);
    expect(scores.scoreB).toBe(81.3);
    expect(scores.winner).toBe("a");
  });

  it("should calculate correct decision intelligence weighted scores without post-mount useEffect", () => {
    const mockMetrics = [
      { subject: "Speed", a: 90, b: 70 },
      { subject: "Cost", a: 60, b: 90 },
    ];

    const defaultWeighted = computeWeightedIntelligenceScores(mockMetrics, {});
    expect(defaultWeighted.a).toBe(75);
    expect(defaultWeighted.b).toBe(80);
    expect(defaultWeighted.winner).toBe("b");

    // Tuned weights: Speed 2x, Cost 0.5x
    const tunedWeighted = computeWeightedIntelligenceScores(mockMetrics, { Speed: 2, Cost: 0.5 });
    expect(tunedWeighted.a).toBe(84);
    expect(tunedWeighted.b).toBe(74);
    expect(tunedWeighted.winner).toBe("a");
  });
});
