import { describe, expect, it } from "vitest";
import { analyzeComparisonQuery } from "../comparisonTaxonomy";
import { asciiSlug, transliterate, unicodeSlug } from "../text";
import { normalizeQuery } from "../../../api/_lib/query-normalizer";

describe("text helpers", () => {
  it("transliterates Cyrillic and Azerbaijani for URL slugs", () => {
    expect(asciiSlug("Япония vs Германия")).toBe("yaponiya-vs-germaniya");
    expect(asciiSlug("Bakı vs Gəncə")).toBe("baki-vs-gence");
    expect(asciiSlug("İstanbul vs Şəki")).toBe("istanbul-vs-seki");
    expect(asciiSlug("???", "comparison")).toBe("comparison");
    expect(transliterate("Çay")).toBe("cay");
  });

  it("keeps identity keys script-specific so different pairs never collide", () => {
    expect(unicodeSlug("Япония")).not.toBe(unicodeSlug("Германия"));
    expect(unicodeSlug("Gəncə")).toBe("gəncə");
  });
});

describe("multilingual comparison identity", () => {
  it("does not collapse different Russian pairs into one cache key", () => {
    const a = normalizeQuery("Япония vs Германия");
    const b = normalizeQuery("Яндекс Музыка vs Спотифай");
    expect(a.canonicalSlug).not.toContain("unknown");
    expect(a.canonicalSlug).not.toBe(b.canonicalSlug);
  });

  it("keeps Azerbaijani letters intact in extracted entities", () => {
    const intent = analyzeComparisonQuery("Bakı vs Gəncə for yaşayış");
    expect(intent.entityA?.toLowerCase()).toBe("bakı");
    expect(intent.entityB?.toLowerCase()).toBe("gəncə");
  });

  it("is order-independent for Russian pairs", () => {
    expect(normalizeQuery("Япония vs Германия").canonicalSlug).toBe(normalizeQuery("Германия vs Япония").canonicalSlug);
  });
});

describe("policy gate covers Russian and Azerbaijani", () => {
  const blocked: Array<[string, string]> = [
    ["Плов vs Шашлык", "food-drink"],
    ["Plov vs Dolma", "food-drink"],
    ["Путин vs Зеленский", "people-vs-people"],
    ["Первая мировая война vs Вторая мировая война", "war-conflict"],
    ["Qarabağ müharibəsi vs Vətən müharibəsi", "war-conflict"],
    ["Кофе vs Чай", "food-drink"],
  ];
  it.each(blocked)("blocks %s", (query, signal) => {
    const intent = analyzeComparisonQuery(query);
    expect(intent.canStart).toBe(false);
    expect(intent.signals.map((item) => item.id)).toContain(signal);
  });

  const allowed = ["Япония vs Германия", "iPhone 16 vs Pixel 9 for фотографии", "Bakı vs Gəncə for yaşayış", "Яндекс Музыка vs Spotify"];
  it.each(allowed)("still allows %s", (query) => {
    expect(analyzeComparisonQuery(query).canStart).toBe(true);
  });
});
