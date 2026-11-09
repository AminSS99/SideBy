/**
 * AUTHORED BUT UNEXECUTED — deferred testing instruction (EXPERIENCE-01).
 * Do not run these tests until validation is explicitly authorized by coordinator.
 *
 * Covers:
 * 1. Finite score validation and positive fullMark handling.
 * 2. Strict normalized score bounding [0, 100].
 * 3. Handling missing / non-finite scores safely.
 * 4. Product-defined "close result" threshold (< 1.5 pts) wording.
 * 5. Normalized weighted contribution calculations for winner drivers.
 * 6. Distinct states: becoming a close result, flipping the leader, expanding or narrowing a lead.
 * 7. Precisely labeled +10 pt hypothetical shift simulation.
 */

import { describe, it, expect } from "vitest";
import {
  calculateWeightedOutcome,
  explainWinnerShift,
  simulateOutcomeFlips,
  normalizeDimensionScore,
  CLOSE_RESULT_THRESHOLD,
  HYPOTHETICAL_SCORE_SHIFT,
  type DimensionItem,
} from "../tradeoff-engine";

const testDimensions: DimensionItem[] = [
  { subject: "Data Fetching", a: 80, b: 95, fullMark: 100 }, // B +15
  { subject: "Developer Experience", a: 95, b: 75, fullMark: 100 }, // A +20
  { subject: "Ecosystem & Hosting", a: 90, b: 70, fullMark: 100 }, // A +20
  { subject: "Standard Web APIs", a: 70, b: 90, fullMark: 100 }, // B +20
];

describe("normalizeDimensionScore", () => {
  it("normalizes finite scores with positive fullMark correctly", () => {
    expect(normalizeDimensionScore(85, 100)).toBe(85);
    expect(normalizeDimensionScore(45, 50)).toBe(90);
  });

  it("clamps normalized scores strictly within [0, 100]", () => {
    expect(normalizeDimensionScore(120, 100)).toBe(100);
    expect(normalizeDimensionScore(-15, 100)).toBe(0);
  });

  it("returns null for non-finite scores or non-positive fullMark", () => {
    expect(normalizeDimensionScore(NaN, 100)).toBeNull();
    expect(normalizeDimensionScore(Infinity, 100)).toBeNull();
    expect(normalizeDimensionScore(80, 0)).toBeNull();
    expect(normalizeDimensionScore(80, -50)).toBeNull();
    expect(normalizeDimensionScore(80, NaN)).toBeNull();
  });
});

describe("calculateWeightedOutcome", () => {
  it("calculates normalized composite support indices with default weights", () => {
    // Equal weights of 3 across all 4 dimensions
    // A: (80 + 95 + 90 + 70) / 4 = 335 / 4 = 83.75 -> 83.8
    // B: (95 + 75 + 70 + 90) / 4 = 330 / 4 = 82.5 -> 82.5
    // Margin: 83.8 - 82.5 = 1.3 pts -> close result (< 1.5 threshold)
    const outcome = calculateWeightedOutcome(testDimensions, {});

    expect(outcome.scoreKind).toBe("composite-support-index");
    expect(outcome.scoreA).toBe(83.8);
    expect(outcome.scoreB).toBe(82.5);
    expect(outcome.margin).toBe(1.3);
    expect(outcome.isCloseResult).toBe(true);
    expect(outcome.winner).toBe("tie");
    expect(outcome.validDimensionsCount).toBe(4);
  });

  it("filters out invalid dimensions without crashing or NaN scores", () => {
    const corruptDimensions: DimensionItem[] = [
      ...testDimensions,
      { subject: "Corrupted Metric", a: NaN, b: 50, fullMark: 100 },
      { subject: "Zero Mark", a: 50, b: 50, fullMark: 0 },
    ];

    const outcome = calculateWeightedOutcome(corruptDimensions, {});
    expect(Number.isFinite(outcome.scoreA)).toBe(true);
    expect(Number.isFinite(outcome.scoreB)).toBe(true);
    expect(outcome.validDimensionsCount).toBe(4); // the 2 invalid ones were skipped
  });

  it("determines decisive winner when margin >= 1.5 points", () => {
    // Heavily weight Developer Experience and Ecosystem (where A leads)
    const outcome = calculateWeightedOutcome(testDimensions, {
      "Developer Experience": 5,
      "Ecosystem & Hosting": 5,
      "Data Fetching": 1,
      "Standard Web APIs": 1,
    });

    expect(outcome.isCloseResult).toBe(false);
    expect(outcome.winner).toBe("a");
    expect(outcome.scoreA).toBeGreaterThan(outcome.scoreB);
    expect(outcome.margin).toBeGreaterThanOrEqual(CLOSE_RESULT_THRESHOLD);
  });

  it("clamps weights strictly between 1 and 5", () => {
    const outcome = calculateWeightedOutcome(testDimensions, {
      "Data Fetching": 999, // should clamp to 5
      "Developer Experience": -50, // should clamp to 1
    });

    expect(outcome.weightsApplied["Data Fetching"]).toBe(5);
    expect(outcome.weightsApplied["Developer Experience"]).toBe(1);
  });

  it("handles empty dimensions gracefully", () => {
    const outcome = calculateWeightedOutcome([], {});
    expect(outcome.scoreA).toBe(0);
    expect(outcome.scoreB).toBe(0);
    expect(outcome.winner).toBe("tie");
    expect(outcome.isCloseResult).toBe(true);
    expect(outcome.validDimensionsCount).toBe(0);
  });
});

describe("explainWinnerShift", () => {
  it("describes close results using product-defined threshold wording rather than statistical dead heat", () => {
    const baseline = calculateWeightedOutcome(testDimensions, {});
    const explanation = explainWinnerShift(baseline, baseline, testDimensions, "Next.js", "Remix");

    expect(explanation).toContain("close result");
    expect(explanation).toContain("product-defined 1.5 pt threshold");
    expect(explanation).not.toContain("statistical dead heat");
    expect(explanation).not.toContain("proof of insufficient evidence");
  });

  it("explains why a winner flips using normalized weighted contributions", () => {
    const baseline = calculateWeightedOutcome(testDimensions, {
      "Developer Experience": 5,
      "Ecosystem & Hosting": 5,
    }); // A wins decisively

    // Shift weights so B wins decisively
    const current = calculateWeightedOutcome(testDimensions, {
      "Developer Experience": 1,
      "Ecosystem & Hosting": 1,
      "Data Fetching": 5,
      "Standard Web APIs": 5,
    }); // B wins

    const explanation = explainWinnerShift(baseline, current, testDimensions, "Next.js", "Remix");

    expect(explanation).toContain("Remix overtakes Next.js");
    expect(explanation).toContain("primary driver is");
  });

  it("distinguishes narrowing a lead from flipping the leader", () => {
    const baseline = calculateWeightedOutcome(testDimensions, {
      "Developer Experience": 5,
      "Ecosystem & Hosting": 5,
      "Data Fetching": 1,
      "Standard Web APIs": 1,
    }); // A leads by ~8.5 pts

    // Adjust weights so A still leads, but gap narrows to ~3.5 pts
    const narrowed = calculateWeightedOutcome(testDimensions, {
      "Developer Experience": 4,
      "Ecosystem & Hosting": 4,
      "Data Fetching": 3,
      "Standard Web APIs": 3,
    });

    const explanation = explainWinnerShift(baseline, narrowed, testDimensions, "Next.js", "Remix");

    expect(explanation).toContain("remains ahead, but the lead narrowed");
    expect(explanation).not.toContain("overtakes");
  });

  it("distinguishes becoming tied / close result from a decisive outcome", () => {
    const baseline = calculateWeightedOutcome(testDimensions, {
      "Developer Experience": 5,
      "Ecosystem & Hosting": 5,
      "Data Fetching": 1,
      "Standard Web APIs": 1,
    }); // Decisive A lead

    const closeOutcome = calculateWeightedOutcome(testDimensions, {}); // Close result

    const explanation = explainWinnerShift(baseline, closeOutcome, testDimensions, "Next.js", "Remix");

    expect(explanation).toContain("bring Next.js and Remix into a close result");
    expect(explanation).toContain("Neither option holds a dominant lead");
  });
});

describe("simulateOutcomeFlips", () => {
  it("generates outcome flip scenarios for high-leverage dimensions with exact +10 pt labeling", () => {
    const baselineWeights = {
      "Data Fetching": 3,
      "Developer Experience": 3,
      "Ecosystem & Hosting": 3,
      "Standard Web APIs": 3,
    };

    const scenarios = simulateOutcomeFlips(
      testDimensions,
      baselineWeights,
      "Next.js",
      "Remix",
    );

    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0].leverageScore).toBeGreaterThanOrEqual(scenarios[scenarios.length - 1].leverageScore);

    // Assumption scenarios must use exact +10 pt label, not 15%
    const assumptionScenarios = scenarios.filter((s) => s.kind === "assumption-shift");
    if (assumptionScenarios.length > 0) {
      expect(assumptionScenarios[0].title).toContain(`+${HYPOTHETICAL_SCORE_SHIFT} pt rating shift`);
      expect(assumptionScenarios[0].description).toContain(`${HYPOTHETICAL_SCORE_SHIFT} points higher on the 0–100 scale`);
    }
  });
});
