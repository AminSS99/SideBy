import { describe, expect, it } from "vitest";
import {
  applyTranslations,
  chunkStrings,
  collectTranslatableSlots,
  isTranslationLanguage,
  translationCacheKey,
} from "../result-translation.js";

const result = {
  slug: "a-vs-b",
  query: "A vs B",
  entities: {
    a: { name: "Tesla Model 3", subtitle: "Mass-market EV", hex: "#ff0000", mark: "T" },
    b: { name: "BMW i4", subtitle: "Premium EV sedan", hex: "#0000ff", mark: "B" },
  },
  verdict: { bestOverall: "Tesla Model 3", bestValue: "BMW i4", developers: "Daily use", teams: "", students: "Budget", powerUsers: "Power", summary: "Both are great." },
  dimensions: [{ subject: "Range", a: 90, b: 70, fullMark: 100 }],
  consensus: ["Tesla wins on charging"],
  contradictions: ["Design is subjective"],
  categories: [
    {
      name: "Range & Efficiency",
      winner: "a",
      verdict: "Tesla leads.",
      facts: [
        { entity: "a", label: "EPA Range", value: "358 miles", sourceUrl: "https://tesla.com", confidence: 0.9, previousValue: "340 miles" },
        { entity: "b", label: "EPA Range", value: "301 miles", sourceUrl: "https://bmw.com", confidence: 0.9 },
      ],
    },
  ],
  sources: [{ title: "Tesla", url: "https://tesla.com", summary: "Official specs" }],
  taxonomy: { label: "Products", disclaimer: "Check local prices." },
};

describe("result translation", () => {
  it("collects only prose fields, never names, urls, numbers or ids", () => {
    const values = collectTranslatableSlots(result).map((slot) => slot.value);
    expect(values).toContain("Both are great.");
    expect(values).toContain("EPA Range");
    expect(values).toContain("340 miles");
    expect(values).toContain("Check local prices.");
    expect(values).not.toContain("Tesla Model 3");
    expect(values).not.toContain("BMW i4");
    expect(values).not.toContain("https://tesla.com");
    expect(values).not.toContain("#ff0000");
    expect(values).not.toContain("Products");
    expect(values).not.toContain(""); // empty verdict.teams is skipped
  });

  it("applies translations in place on a clone and leaves everything else intact", () => {
    const slots = collectTranslatableSlots(result);
    const translated = applyTranslations(result, slots, slots.map((slot) => `RU:${slot.value}`));
    expect(translated.verdict.summary).toBe("RU:Both are great.");
    expect(translated.categories[0].facts[1].label).toBe("RU:EPA Range");
    expect(translated.categories[0].facts[1].sourceUrl).toBe("https://bmw.com");
    expect(translated.entities.a.name).toBe("Tesla Model 3");
    expect(translated.dimensions[0].a).toBe(90);
    // original untouched
    expect(result.verdict.summary).toBe("Both are great.");
  });

  it("keeps the original text when a translation is missing", () => {
    const slots = collectTranslatableSlots(result);
    const translated = applyTranslations(result, slots, []);
    expect(translated.verdict.summary).toBe("Both are great.");
  });

  it("chunks by count and size and preserves order", () => {
    const values = Array.from({ length: 95 }, (_, index) => `item ${index}`);
    const chunks = chunkStrings(values);
    expect(chunks.length).toBe(3);
    expect(chunks.flat()).toEqual(values);
    const big = chunkStrings(["x".repeat(4000), "y".repeat(4000)]);
    expect(big).toHaveLength(2);
  });

  it("changes the cache key when content or language changes", () => {
    const slots = collectTranslatableSlots(result);
    const keyRu = translationCacheKey("id-1", "ru", slots);
    expect(translationCacheKey("id-1", "az", slots)).not.toBe(keyRu);
    const edited = collectTranslatableSlots({ ...result, verdict: { ...result.verdict, summary: "Different." } });
    expect(translationCacheKey("id-1", "ru", edited)).not.toBe(keyRu);
  });

  it("accepts only supported languages", () => {
    expect(isTranslationLanguage("az")).toBe(true);
    expect(isTranslationLanguage("ru")).toBe(true);
    expect(isTranslationLanguage("en")).toBe(false);
    expect(isTranslationLanguage("fr")).toBe(false);
  });
});
