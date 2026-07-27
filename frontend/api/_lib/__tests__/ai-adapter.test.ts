import { describe, it, expect } from 'vitest';
import { estimateCost } from '../ai-adapter.js'; // Use .js extension for local ESM imports

describe('estimateCost', () => {
  it('calculates cost correctly for a known model (gpt-4o)', () => {
    // gpt-4o: 2.5 input, 10.0 output per 1M tokens
    const cost = estimateCost(1_000_000, 1_000_000, 'gpt-4o');
    expect(cost).toBeCloseTo(12.5);
  });

  it('calculates cost correctly for a known model (deepseek-chat)', () => {
    // deepseek-chat: 0.14 input, 0.28 output per 1M tokens
    const cost = estimateCost(500_000, 2_000_000, 'deepseek-chat');
    // 0.5 * 0.14 + 2 * 0.28 = 0.07 + 0.56 = 0.63
    expect(cost).toBeCloseTo(0.63);
  });

  it('handles zero tokens correctly', () => {
    const cost = estimateCost(0, 0, 'gpt-4o-mini');
    expect(cost).toBe(0);
  });

  it('handles small token counts correctly', () => {
    // gpt-4o-mini: 0.15 input, 0.6 output per 1M tokens
    // 1000 input, 2000 output
    // 0.001 * 0.15 + 0.002 * 0.6 = 0.00015 + 0.0012 = 0.00135
    const cost = estimateCost(1_000, 2_000, 'gpt-4o-mini');
    expect(cost).toBeCloseTo(0.00135);
  });

  it('returns 0 for an unknown model', () => {
    const cost = estimateCost(1_000_000, 1_000_000, 'unknown-model');
    expect(cost).toBe(0);
  });

  it('calculates cost correctly when input tokens are zero but output tokens exist', () => {
    // gpt-4o: 2.5 input, 10.0 output per 1M tokens
    const cost = estimateCost(0, 1_000_000, 'gpt-4o');
    expect(cost).toBeCloseTo(10.0);
  });

  it('calculates cost correctly when output tokens are zero but input tokens exist', () => {
    // gpt-4o: 2.5 input, 10.0 output per 1M tokens
    const cost = estimateCost(1_000_000, 0, 'gpt-4o');
    expect(cost).toBeCloseTo(2.5);
  });
});
