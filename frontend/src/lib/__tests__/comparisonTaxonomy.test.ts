import { describe, expect, it } from "vitest";
import {
  SUPPORTED_COMPARISON_CATEGORIES,
  analyzeComparisonQuery,
} from "../comparisonTaxonomy";

describe("comparison taxonomy eligibility", () => {
  it.each([
    "Astra vs Astro for a web project",
    "Astro vs Vue.js",
    "Supabase vs Firebase",
  ])("accepts technical decision options: %s", (query) => {
    const intent = analyzeComparisonQuery(query);
    expect(intent.canStart).toBe(true);
    expect(["software", "developer_tool"]).toContain(intent.category);
  });

  it.each([
    "capitalism vs socialism",
    "Democrats vs Republicans",
    "height vs intelligence",
    "Elon Musk vs Jeff Bezos",
  ])("blocks political and personal subjects: %s", (query) => {
    const intent = analyzeComparisonQuery(query);
    expect(intent.canStart).toBe(false);
    expect(intent.status).toBe("sensitive");
  });

  it("requires exactly two distinct options", () => {
    expect(analyzeComparisonQuery("React vs Vue vs Angular").canStart).toBe(false);
    expect(analyzeComparisonQuery("React vs React").status).toBe("incomparable");
  });

  it.each(["Supabassee", "Supabassseee"])("blocks %s as a Supabase misspelling", (typo) => {
    const intent = analyzeComparisonQuery(`Supabase vs ${typo} for a SaaS`);

    expect(intent.canStart).toBe(false);
    expect(intent.status).toBe("incomparable");
    expect(intent.message).toMatch(/same option/i);
    expect(intent.resolvedEntity).toBe("Supabase");
  });

  it("keeps explicit variants of one product eligible for comparison", () => {
    const intent = analyzeComparisonQuery("Supabase Cloud vs self-hosted Supabase for a SaaS");

    expect(intent.canStart).toBe(true);
    expect(intent.category).toBe("developer_tool");
  });

  it("does not advertise political comparisons as supported", () => {
    expect(SUPPORTED_COMPARISON_CATEGORIES.map((category) => category.id))
      .not.toContain("politics_policy");
  });

  it("does not infer a product category from a partial name collision", () => {
    expect(analyzeComparisonQuery("sun vs son").category).toBe("general_research");
    expect(analyzeComparisonQuery("Sage vs Stripe").status).not.toBe("sensitive");
  });
});

describe("people and war scope policy", () => {
  const blocked = [
    "Ukraine war vs Vietnam war",
    "World War 1 vs World War 2",
    "Israel vs Palestine conflict",
    "Hitler vs Stalin",
    "Messi vs Ronaldo",
    "Napoleon vs Alexander the Great",
    "ISIS vs Al Qaeda",
    "Nuclear weapons vs conventional weapons",
    "Elon Musk vs Jeff Bezos",
  ];
  const allowed = [
    "Next.js vs Remix",
    "Star Wars Battlefront vs Call of Duty",
    "Warp vs iTerm2",
    "Total War Warhammer vs Civilization VI",
    "Modify vs Mercurial",
    "iPhone vs Pixel",
  ];
  it.each(blocked)("blocks %s", (query) => {
    expect(analyzeComparisonQuery(query).canStart).toBe(false);
  });
  it.each(allowed)("allows %s", (query) => {
    expect(analyzeComparisonQuery(query).canStart).toBe(true);
  });
});
