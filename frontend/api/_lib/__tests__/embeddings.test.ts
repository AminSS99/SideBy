import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '../embeddings.js';

describe('cosineSimilarity', () => {
  it('throws an error if vectors have different dimensions', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vectors must have the same dimension.');
  });

  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  it('returns -1 for opposite vectors', () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0);
  });

  it('computes correct similarity for normal vectors', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    // a = [1,2,3], normA = sqrt(14)
    // b = [4,5,6], normB = sqrt(77)
    // dot = 4 + 10 + 18 = 32
    // sim = 32 / sqrt(14 * 77) = 32 / sqrt(1078) ≈ 0.9746318
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.9746318, 5);
  });

  it('returns 0 if either vector has a norm of 0 (all zeros)', () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
    expect(cosineSimilarity(b, a)).toBe(0);
    expect(cosineSimilarity(a, a)).toBe(0);
  });

  it('returns 0 for empty vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });
});
