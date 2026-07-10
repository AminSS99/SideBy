/**
 * Validation Regression Suite
 *
 * Runs the review dataset through the deterministic rules layer to catch
 * false positives (should reject but passes) and false negatives (should pass but rejects).
 *
 * Cases with layer: "ai" are skipped — they require the AI gate and are tested
 * via integration tests or manual review.
 *
 * Run: pnpm exec vitest run src/lib/__tests__/validationRegression.test.ts
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { analyzeComparisonQuery } from "../comparisonTaxonomy";

interface ReviewCase {
  query: string;
  expectedRelation: string;
  expectedCanStart: boolean;
  category: string;
  reason: string;
  layer: "rules" | "ai";
}

const dataset: ReviewCase[] = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../../api/_lib/validation-review-dataset.json"),
    "utf-8",
  ),
);

const rulesCases = dataset.filter((c) => c.layer === "rules");
const aiCases = dataset.filter((c) => c.layer === "ai");

describe("validation regression suite (deterministic rules)", () => {
  const falsePositives: string[] = [];
  const falseNegatives: string[] = [];

  for (const testCase of rulesCases) {
    it(`"${testCase.query}" → canStart=${testCase.expectedCanStart}`, () => {
      const result = analyzeComparisonQuery(testCase.query);

      if (testCase.expectedCanStart && !result.canStart) {
        falseNegatives.push(
          `FALSE NEGATIVE: "${testCase.query}" should pass but was rejected (${result.status}: ${result.message})`,
        );
      }

      if (!testCase.expectedCanStart && result.canStart) {
        falsePositives.push(
          `FALSE POSITIVE: "${testCase.query}" should be rejected but passed (category: ${result.category})`,
        );
      }

      expect(result.canStart).toBe(testCase.expectedCanStart);
    });
  }

  it("no false positives in rules-layer dataset", () => {
    if (falsePositives.length > 0) {
      console.error("\n--- FALSE POSITIVES ---");
      falsePositives.forEach((fp) => console.error(fp));
    }
    expect(falsePositives).toHaveLength(0);
  });

  it("no false negatives in rules-layer dataset", () => {
    if (falseNegatives.length > 0) {
      console.error("\n--- FALSE NEGATIVES ---");
      falseNegatives.forEach((fn) => console.error(fn));
    }
    expect(falseNegatives).toHaveLength(0);
  });
});

describe("AI-layer cases (documented, not enforced)", () => {
  it(`${aiCases.length} cases require AI validation`, () => {
    for (const testCase of aiCases) {
      const result = analyzeComparisonQuery(testCase.query);
      if (result.canStart !== testCase.expectedCanStart) {
        console.warn(
          `[AI NEEDED] "${testCase.query}" → rules say canStart=${result.canStart}, expected=${testCase.expectedCanStart} (${testCase.reason})`,
        );
      }
    }
    expect(aiCases.length).toBeGreaterThan(0);
  });
});
