import { describe, it, expect } from "vitest";
import { computeDecisionScores } from "../DecisionMatrixPanel";
import type { ComparisonDimension } from "../types";

describe("DecisionMatrixPanel computeDecisionScores", () => {
  const mockDimensions: ComparisonDimension[] = [
    {
      subject: "Performance",
      fullMark: 100,
      a: 90,
      b: 80,
    },
    {
      subject: "Ecosystem",
      fullMark: 100,
      a: 70,
      b: 95,
    },
    {
      subject: "Developer Experience",
      fullMark: 100,
      a: 85,
      b: 85,
    },
  ];

  it("handles undefined or empty dimensions by returning zero scores and a tie", () => {
    expect(computeDecisionScores(undefined)).toEqual({
      scoreA: 0,
      scoreB: 0,
      winner: "tie",
    });

    expect(computeDecisionScores([])).toEqual({
      scoreA: 0,
      scoreB: 0,
      winner: "tie",
    });
  });

  it("calculates balanced weighted score with default weights of 3", () => {
    // When no weights are passed, each dimension defaults to 3
    // a: (90 + 70 + 85) / 3 = 245 / 3 = 81.666... => 81.7
    // b: (80 + 95 + 85) / 3 = 260 / 3 = 86.666... => 86.7
    const result = computeDecisionScores(mockDimensions, {});
    expect(result.scoreA).toBe(81.7);
    expect(result.scoreB).toBe(86.7);
    expect(result.winner).toBe("b");
  });

  it("prioritizes entity A when A-dominant dimension weight is increased", () => {
    // Heavily weight Performance (where A has 90 and B has 80)
    const weights = {
      Performance: 5,
      Ecosystem: 1,
      "Developer Experience": 1,
    };
    // Sum weights = 5 + 1 + 1 = 7
    // a: (90*5 + 70*1 + 85*1) / 7 = (450 + 70 + 85) / 7 = 605 / 7 = 86.428... => 86.4
    // b: (80*5 + 95*1 + 85*1) / 7 = (400 + 95 + 85) / 7 = 580 / 7 = 82.857... => 82.9
    const result = computeDecisionScores(mockDimensions, weights);
    expect(result.scoreA).toBe(86.4);
    expect(result.scoreB).toBe(82.9);
    expect(result.winner).toBe("a");
  });

  it("correctly identifies a tie when weighted scores are identical", () => {
    const tiedDimensions: ComparisonDimension[] = [
      {
        subject: "Speed",
        fullMark: 100,
        a: 80,
        b: 80,
      },
    ];

    const result = computeDecisionScores(tiedDimensions, { Speed: 4 });
    expect(result.scoreA).toBe(80);
    expect(result.scoreB).toBe(80);
    expect(result.winner).toBe("tie");
  });

  it("handles non-100 fullMark normalization properly", () => {
    const customScaleDimensions: ComparisonDimension[] = [
      {
        subject: "ScoreOutOf10",
        fullMark: 10,
        a: 8,
        b: 9,
      },
    ];

    const result = computeDecisionScores(customScaleDimensions, { ScoreOutOf10: 2 });
    expect(result.scoreA).toBe(80);
    expect(result.scoreB).toBe(90);
    expect(result.winner).toBe("b");
  });
});
