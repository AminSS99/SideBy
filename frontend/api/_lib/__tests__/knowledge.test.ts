import { describe, expect, it } from "vitest";
import { formatKnowledgeContext } from "../knowledge.js";
import type { KnowledgeSearchChunk } from "../knowledge.js";

describe("formatKnowledgeContext", () => {
  it("should return an empty string for an empty array", () => {
    expect(formatKnowledgeContext([])).toBe("");
  });

  it("should format a single chunk correctly", () => {
    const chunks: KnowledgeSearchChunk[] = [
      {
        id: "1",
        documentId: "doc-1",
        filename: "test-doc.pdf",
        chunkIndex: 0,
        text: "This is some test content.",
        tokenEstimate: 5,
        similarity: 0.9,
        metadata: {},
      },
    ];

    const expected = "[test-doc.pdf chunk 1]\nThis is some test content.";
    expect(formatKnowledgeContext(chunks)).toBe(expected);
  });

  it("should format and join multiple chunks correctly", () => {
    const chunks: KnowledgeSearchChunk[] = [
      {
        id: "1",
        documentId: "doc-1",
        filename: "test-doc.pdf",
        chunkIndex: 0,
        text: "Content 1.",
        tokenEstimate: 2,
        similarity: 0.9,
        metadata: {},
      },
      {
        id: "2",
        documentId: "doc-1",
        filename: "test-doc.pdf",
        chunkIndex: 2,
        text: "Content 2.",
        tokenEstimate: 2,
        similarity: 0.8,
        metadata: {},
      },
    ];

    const expected =
      "[test-doc.pdf chunk 1]\nContent 1.\n\n---\n\n[test-doc.pdf chunk 3]\nContent 2.";
    expect(formatKnowledgeContext(chunks)).toBe(expected);
  });

  it("should truncate text longer than 2200 characters", () => {
    const longText = "a".repeat(2500);
    const chunks: KnowledgeSearchChunk[] = [
      {
        id: "1",
        documentId: "doc-1",
        filename: "test-doc.pdf",
        chunkIndex: 0,
        text: longText,
        tokenEstimate: 2500,
        similarity: 0.9,
        metadata: {},
      },
    ];

    const expectedText = "a".repeat(2200) + "...";
    const expected = `[test-doc.pdf chunk 1]\n${expectedText}`;
    expect(formatKnowledgeContext(chunks)).toBe(expected);
  });
});
