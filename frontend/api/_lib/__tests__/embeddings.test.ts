import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '../embeddings.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
  });

  it('calculates correct similarity for arbitrary vectors', () => {
    const a = [1, 0, 0];
    const b = [0.5, 0.5, 0];
    // dot product = 0.5
    // normA = 1
    // normB = sqrt(0.25 + 0.25) = sqrt(0.5)
    // similarity = 0.5 / sqrt(0.5) = sqrt(0.5) ≈ 0.70710678
    expect(cosineSimilarity(a, b)).toBeCloseTo(Math.sqrt(0.5));
  });

  it('returns 0 when one vector is all zeros', () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('returns 0 when both vectors are all zeros', () => {
    const a = [0, 0, 0];
    const b = [0, 0, 0];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('returns 0 for empty vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('throws an error if vectors have different dimensions', () => {
    const a = [1, 2];
    const b = [1, 2, 3];
    expect(() => cosineSimilarity(a, b)).toThrowError('Vectors must have the same dimension.');
  });
});
