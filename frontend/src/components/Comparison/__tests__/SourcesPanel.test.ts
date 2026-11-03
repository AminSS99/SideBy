import { describe, it, expect } from "vitest";
import { getParsedSourceMeta } from "../SourcesPanel";
import type { ComparisonSource } from "../types";

describe("SourcesPanel getParsedSourceMeta caching & domain parsing", () => {
  it("should parse domain name correctly and strip www. prefix", () => {
    const source: ComparisonSource = {
      title: "React Documentation",
      url: "https://www.react.dev/reference/react",
      reliability: "Official",
      confidence: 0.95,
      fetchedAt: "2025-01-01T00:00:00.000Z",
    };

    const meta = getParsedSourceMeta(source);
    expect(meta.domain).toBe("react.dev");
    expect(meta.rel.label).toBe("Official");
  });

  it("should handle missing or malformed URLs without crashing", () => {
    // Server payloads can carry reliability strings outside the canonical
    // union; the parser must normalize them instead of crashing.
    const invalidSource = {
      title: "Broken Link",
      url: "invalid-url-string",
      reliability: "news",
      fetchedAt: "2025-01-01T00:00:00.000Z",
    } as unknown as ComparisonSource;

    const meta = getParsedSourceMeta(invalidSource);
    expect(meta.domain).toBeNull();
    expect(meta.rel.label).toBe("News");
  });

  it("should default to Review reliability for unrecognized reliability strings", () => {
    const unknownSource = {
      title: "Blog Post",
      url: "https://example.com/post",
      reliability: "unrecognized_type",
      fetchedAt: "2025-01-01T00:00:00.000Z",
    } as unknown as ComparisonSource;

    const meta = getParsedSourceMeta(unknownSource);
    expect(meta.domain).toBe("example.com");
    expect(meta.rel.label).toBe("Review");
  });

  it("should return identical cached reference on subsequent calls for the same object", () => {
    const source: ComparisonSource = {
      title: "Vite Docs",
      url: "https://vite.dev/guide/",
      reliability: "Docs",
      fetchedAt: "2025-01-01T00:00:00.000Z",
    };

    const firstMeta = getParsedSourceMeta(source);
    const secondMeta = getParsedSourceMeta(source);

    // Exact reference equality confirms WeakMap cache hit
    expect(firstMeta).toBe(secondMeta);
  });
});
