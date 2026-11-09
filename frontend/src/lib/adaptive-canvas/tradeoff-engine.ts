/**
 * Adaptive Decision Canvas — Trade-off & Outcome Simulation Engine
 *
 * Deterministic, pure calculation logic for:
 * 1. Multi-attribute weighting and composite support index evaluation.
 * 2. Winner shift explanation (why an outcome changed).
 * 3. Outcome flip simulation ("What would change the outcome?").
 *
 * EPISTEMOLOGICAL & SEMANTIC INTEGRITY:
 * - Scores are COMPOSITE SUPPORT INDICES (0-100), strictly NOT probabilities.
 * - Margins < 1.5 points are product-defined "close results", NOT statistical dead heats.
 * - Score inputs must be finite numbers; fullMark must be positive.
 * - Normalized contributions govern winner shift explanations.
 * - Hypothetical sensitivity simulations use a precisely labeled +10 pt normalized shift.
 */

export type DimensionItem = {
  subject: string;
  a: number;
  b: number;
  fullMark: number;
};

export type WeightedOutcomeResult = {
  scoreA: number;
  scoreB: number;
  winner: "a" | "b" | "tie";
  margin: number;
  isCloseResult: boolean;
  /** Backward-compatible alias */
  isDeadHeat: boolean;
  scoreKind: "composite-support-index";
  weightsApplied: Record<string, number>;
  totalWeight: number;
  validDimensionsCount: number;
};

export type OutcomeFlipKind = "reweighting" | "assumption-shift" | "new-research";

export type OutcomeFlipScenario = {
  id: string;
  kind: OutcomeFlipKind;
  dimensionSubject: string;
  title: string;
  description: string;
  targetWeight?: number;
  scoreA: number;
  scoreB: number;
  projectedWinner: "a" | "b" | "tie";
  projectedMargin: number;
  leverageScore: number;
};

/** Product-defined threshold below which neither option holds a dominant lead */
export const CLOSE_RESULT_THRESHOLD = 1.5;

/** Precisely defined hypothetical rating shift on normalized 0-100 scale */
export const HYPOTHETICAL_SCORE_SHIFT = 10;

/**
 * Validate and normalize a raw dimension score to the 0-100 range.
 * Returns null if score or fullMark is invalid or non-finite.
 */
export function normalizeDimensionScore(raw: number, fullMark: number): number | null {
  if (!Number.isFinite(raw) || !Number.isFinite(fullMark) || fullMark <= 0) {
    return null;
  }
  const scaled = (raw / fullMark) * 100;
  return Math.max(0, Math.min(100, scaled));
}

/**
 * Calculate composite support indices for entities A and B under a given set of weights.
 */
export function calculateWeightedOutcome(
  dimensions: readonly DimensionItem[],
  weights: Record<string, number> = {},
): WeightedOutcomeResult {
  if (!Array.isArray(dimensions) || dimensions.length === 0) {
    return {
      scoreA: 0,
      scoreB: 0,
      winner: "tie",
      margin: 0,
      isCloseResult: true,
      isDeadHeat: true,
      scoreKind: "composite-support-index",
      weightsApplied: {},
      totalWeight: 0,
      validDimensionsCount: 0,
    };
  }

  let totalWeight = 0;
  let weightedSumA = 0;
  let weightedSumB = 0;
  let validCount = 0;
  const weightsApplied: Record<string, number> = {};

  for (const dim of dimensions) {
    const normA = normalizeDimensionScore(dim.a, dim.fullMark);
    const normB = normalizeDimensionScore(dim.b, dim.fullMark);

    // Skip dimensions where scores cannot be validated as finite
    if (normA === null || normB === null) {
      continue;
    }

    validCount += 1;
    const rawWeight = weights[dim.subject];
    // Weights are clamped strictly between 1 and 5 (default 3)
    const w =
      typeof rawWeight === "number" && Number.isFinite(rawWeight)
        ? Math.max(1, Math.min(5, Math.round(rawWeight)))
        : 3;

    weightsApplied[dim.subject] = w;
    totalWeight += w;

    weightedSumA += normA * w;
    weightedSumB += normB * w;
  }

  if (validCount === 0 || totalWeight === 0) {
    return {
      scoreA: 0,
      scoreB: 0,
      winner: "tie",
      margin: 0,
      isCloseResult: true,
      isDeadHeat: true,
      scoreKind: "composite-support-index",
      weightsApplied,
      totalWeight: 0,
      validDimensionsCount: 0,
    };
  }

  const scoreA = Number(Math.max(0, Math.min(100, weightedSumA / totalWeight)).toFixed(1));
  const scoreB = Number(Math.max(0, Math.min(100, weightedSumB / totalWeight)).toFixed(1));
  const margin = Number(Math.abs(scoreA - scoreB).toFixed(1));
  const isCloseResult = margin < CLOSE_RESULT_THRESHOLD;

  let winner: "a" | "b" | "tie" = "tie";
  if (!isCloseResult) {
    if (scoreA > scoreB) winner = "a";
    else if (scoreB > scoreA) winner = "b";
  }

  return {
    scoreA,
    scoreB,
    winner,
    margin,
    isCloseResult,
    isDeadHeat: isCloseResult,
    scoreKind: "composite-support-index",
    weightsApplied,
    totalWeight,
    validDimensionsCount: validCount,
  };
}

/**
 * Generate a transparent plain-language explanation of why the winner changed or stayed ahead.
 * Distinguishes:
 * 1. Becoming a close result / tied
 * 2. Reversing the leader (flip)
 * 3. Merely narrowing a lead
 * 4. Expanding a lead
 */
export function explainWinnerShift(
  baseline: WeightedOutcomeResult,
  current: WeightedOutcomeResult,
  dimensions: readonly DimensionItem[],
  entityAName: string,
  entityBName: string,
): string {
  if (current.validDimensionsCount === 0) {
    return "No validated dimension scores available for trade-off evaluation.";
  }

  // 1. Current result is within the close result threshold
  if (current.isCloseResult) {
    if (!baseline.isCloseResult) {
      return `Adjusted weights bring ${entityAName} and ${entityBName} into a close result (margin narrowed to ${current.margin.toFixed(1)} pts, within the product-defined ${CLOSE_RESULT_THRESHOLD} pt threshold). Neither option holds a dominant lead under these priorities.`;
    }
    return `${entityAName} and ${entityBName} are in a close result (margin of ${current.margin.toFixed(1)} pts, within the product-defined ${CLOSE_RESULT_THRESHOLD} pt threshold). Neither option holds a dominant lead under these priority weights.`;
  }

  const currentLeaderName = current.winner === "a" ? entityAName : entityBName;
  const currentTrailerName = current.winner === "a" ? entityBName : entityAName;

  // Compute normalized weighted contributions to identify drivers accurately
  const normalizedDrivers = dimensions
    .map((dim) => {
      const normA = normalizeDimensionScore(dim.a, dim.fullMark);
      const normB = normalizeDimensionScore(dim.b, dim.fullMark);
      if (normA === null || normB === null) return null;

      const weight = current.weightsApplied[dim.subject] ?? 3;
      const leaderNorm = current.winner === "a" ? normA : normB;
      const trailerNorm = current.winner === "a" ? normB : normA;
      const normDiff = leaderNorm - trailerNorm;
      const weightedContribution = current.totalWeight > 0 ? (normDiff * weight) / current.totalWeight : 0;

      return {
        subject: dim.subject,
        weight,
        leaderNorm: Math.round(leaderNorm),
        trailerNorm: Math.round(trailerNorm),
        normDiff,
        weightedContribution,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.weightedContribution > 0)
    .sort((x, y) => y.weightedContribution - x.weightedContribution);

  const topDriver = normalizedDrivers[0];

  // 2. Reversing the leader (flip)
  if (!baseline.isCloseResult && baseline.winner !== "tie" && current.winner !== baseline.winner) {
    if (topDriver) {
      return `${currentLeaderName} overtakes ${currentTrailerName} with a lead of ${current.margin.toFixed(1)} pts. The primary driver is "${topDriver.subject}", where ${currentLeaderName} holds an advantage (${topDriver.leaderNorm} vs ${topDriver.trailerNorm}) and was weighted ${topDriver.weight}x.`;
    }
    return `${currentLeaderName} overtakes ${currentTrailerName} with an advantage of ${current.margin.toFixed(1)} pts under your adjusted weights.`;
  }

  // 3. Leader expanded
  if (current.winner === baseline.winner && current.margin >= baseline.margin + 1.0) {
    if (topDriver) {
      return `${currentLeaderName}'s lead expanded from ${baseline.margin.toFixed(1)} to ${current.margin.toFixed(1)} pts because your weights prioritize "${topDriver.subject}" where ${currentLeaderName} performs strongly.`;
    }
    return `${currentLeaderName}'s lead expanded from ${baseline.margin.toFixed(1)} to ${current.margin.toFixed(1)} pts under current criterion weights.`;
  }

  // 4. Leader narrowed
  if (current.winner === baseline.winner && current.margin <= baseline.margin - 1.0) {
    return `${currentLeaderName} remains ahead, but the lead narrowed from ${baseline.margin.toFixed(1)} to ${current.margin.toFixed(1)} pts because your weights emphasize criteria where ${currentTrailerName} performs well.`;
  }

  return `${currentLeaderName} leads by ${current.margin.toFixed(1)} pts based on current criterion weights.`;
}

/**
 * "What would change the outcome?"
 * Simulates scenarios across all dimensions to identify high-leverage shifts.
 */
export function simulateOutcomeFlips(
  dimensions: readonly DimensionItem[],
  currentWeights: Record<string, number>,
  entityAName: string,
  entityBName: string,
): OutcomeFlipScenario[] {
  const baseline = calculateWeightedOutcome(dimensions, currentWeights);
  const scenarios: OutcomeFlipScenario[] = [];

  for (const dim of dimensions) {
    const normA = normalizeDimensionScore(dim.a, dim.fullMark);
    const normB = normalizeDimensionScore(dim.b, dim.fullMark);
    if (normA === null || normB === null) continue;

    const currentWeight = currentWeights[dim.subject] ?? 3;

    // A. Test Extreme Re-weighting: Shift to 5 and Shift to 1
    const testWeights = [1, 5].filter((w) => w !== currentWeight);

    for (const testW of testWeights) {
      const simulatedWeights = { ...currentWeights, [dim.subject]: testW };
      const outcome = calculateWeightedOutcome(dimensions, simulatedWeights);

      const winnerFlipped = outcome.winner !== baseline.winner && !outcome.isCloseResult;
      const marginSwing = Math.abs(outcome.margin - baseline.margin);

      if (winnerFlipped || marginSwing >= 2.0) {
        const beneficiaryName = outcome.winner === "a" ? entityAName : entityBName;
        const actionVerb = testW > currentWeight ? "Increasing" : "Minimizing";

        scenarios.push({
          id: `reweight-${dim.subject}-${testW}`,
          kind: "reweighting",
          dimensionSubject: dim.subject,
          title: `${actionVerb} "${dim.subject}" weight to ${testW}x`,
          description: winnerFlipped
            ? `If "${dim.subject}" is weighted ${testW}x, ${beneficiaryName} takes the lead with a ${outcome.margin.toFixed(1)} pt margin.`
            : `Changing "${dim.subject}" weight to ${testW}x shifts the composite margin by ${marginSwing.toFixed(1)} pts.`,
          targetWeight: testW,
          scoreA: outcome.scoreA,
          scoreB: outcome.scoreB,
          projectedWinner: outcome.winner,
          projectedMargin: outcome.margin,
          leverageScore: marginSwing + (winnerFlipped ? 10 : 0),
        });
      }
    }

    // B. Precisely Defined Hypothetical Shift: +10 normalized points
    // Simulate +10 pt shift for Entity A on 0-100 scale
    const simulatedDimsA = dimensions.map((d) => {
      if (d.subject !== dim.subject) return d;
      const currentNorm = normalizeDimensionScore(d.a, d.fullMark) ?? 50;
      const shiftedNorm = Math.min(100, currentNorm + HYPOTHETICAL_SCORE_SHIFT);
      // convert back to raw scale with same fullMark
      const shiftedRaw = (shiftedNorm / 100) * d.fullMark;
      return { ...d, a: shiftedRaw };
    });

    const outcomeShiftA = calculateWeightedOutcome(simulatedDimsA, currentWeights);
    if (outcomeShiftA.winner !== baseline.winner && outcomeShiftA.winner === "a" && !outcomeShiftA.isCloseResult) {
      scenarios.push({
        id: `assumption-${dim.subject}-shiftA`,
        kind: "assumption-shift",
        dimensionSubject: dim.subject,
        title: `Hypothetical +${HYPOTHETICAL_SCORE_SHIFT} pt rating shift for ${entityAName} on "${dim.subject}"`,
        description: `If verified performance for ${entityAName} on "${dim.subject}" were ${HYPOTHETICAL_SCORE_SHIFT} points higher on the 0–100 scale, ${entityAName} would take the lead with a ${outcomeShiftA.margin.toFixed(1)} pt margin.`,
        scoreA: outcomeShiftA.scoreA,
        scoreB: outcomeShiftA.scoreB,
        projectedWinner: "a",
        projectedMargin: outcomeShiftA.margin,
        leverageScore: 8,
      });
    }

    // Simulate +10 pt shift for Entity B on 0-100 scale
    const simulatedDimsB = dimensions.map((d) => {
      if (d.subject !== dim.subject) return d;
      const currentNorm = normalizeDimensionScore(d.b, d.fullMark) ?? 50;
      const shiftedNorm = Math.min(100, currentNorm + HYPOTHETICAL_SCORE_SHIFT);
      const shiftedRaw = (shiftedNorm / 100) * d.fullMark;
      return { ...d, b: shiftedRaw };
    });

    const outcomeShiftB = calculateWeightedOutcome(simulatedDimsB, currentWeights);
    if (outcomeShiftB.winner !== baseline.winner && outcomeShiftB.winner === "b" && !outcomeShiftB.isCloseResult) {
      scenarios.push({
        id: `assumption-${dim.subject}-shiftB`,
        kind: "assumption-shift",
        dimensionSubject: dim.subject,
        title: `Hypothetical +${HYPOTHETICAL_SCORE_SHIFT} pt rating shift for ${entityBName} on "${dim.subject}"`,
        description: `If verified performance for ${entityBName} on "${dim.subject}" were ${HYPOTHETICAL_SCORE_SHIFT} points higher on the 0–100 scale, ${entityBName} would take the lead with a ${outcomeShiftB.margin.toFixed(1)} pt margin.`,
        scoreA: outcomeShiftB.scoreA,
        scoreB: outcomeShiftB.scoreB,
        projectedWinner: "b",
        projectedMargin: outcomeShiftB.margin,
        leverageScore: 8,
      });
    }
  }

  return scenarios.sort((a, b) => b.leverageScore - a.leverageScore);
}
