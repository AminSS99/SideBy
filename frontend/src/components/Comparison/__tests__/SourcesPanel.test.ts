import { describe, it, expect } from "vitest";
import { getParsedSourceMeta } from "../SourcesPanel";
import type { ComparisonSource } from "../types";

describe("SourcesPanel getParsedSourceMeta caching & domain parsing", () => {
  it("should parse domain name correctly and strip www. prefix", () => {
    const source: ComparisonSource = {
      title: "React Documentation",
      url: "https://www.react.dev/reference/react",
      reliability: "official",
      confidence: 0.95,
    };

    const meta = getParsedSourceMeta(source);
    expect(meta.domain).toBe("react.dev");
    expect(meta.rel.label).toBe("Official");
  });

  it("should handle missing or malformed URLs without crashing", () => {
    const invalidSource: ComparisonSource = {
      title: "Broken Link",
      url: "invalid-url-string",
      reliability: "news",
    };

    const meta = getParsedSourceMeta(invalidSource);
    expect(meta.domain).toBeNull();
    expect(meta.rel.label).toBe("News");
  });

  it("should default to Review reliability for unrecognized reliability strings", () => {
    const unknownSource: ComparisonSource = {
      title: "Blog Post",
      url: "https://example.com/post",
      reliability: "unrecognized_type",
    };

    const meta = getParsedSourceMeta(unknownSource);
    expect(meta.domain).toBe("example.com");
    expect(meta.rel.label).toBe("Review");
  });

  it("should return identical cached reference on subsequent calls for the same object", () => {
    const source: ComparisonSource = {
      title: "Vite Docs",
      url: "https://vite.dev/guide/",
      reliability: "docs",
    };

    const firstMeta = getParsedSourceMeta(source);
    const secondMeta = getParsedSourceMeta(source);

    // Exact reference equality confirms WeakMap cache hit
    expect(firstMeta).toBe(secondMeta);
  });
});
