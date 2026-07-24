import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProvider, getPrimaryProvider, listAvailableProviders, deepseek, openrouter } from '../index.js';

describe('providers index', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getProvider', () => {
    it('returns deepseek adapter when name is "deepseek"', () => {
      const provider = getProvider('deepseek');
      expect(provider).toBe(deepseek);
    });

    it('returns openrouter adapter when name is "openrouter"', () => {
      const provider = getProvider('openrouter');
      expect(provider).toBe(openrouter);
    });

    it('throws an error for unknown providers', () => {
      // @ts-expect-error Testing invalid input at runtime
      expect(() => getProvider('unknown')).toThrow('Unknown provider: unknown');
    });
  });

  describe('getPrimaryProvider', () => {
    it('returns deepseek if DEEPSEEK_API_KEY is set', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', 'test-key');
      expect(getPrimaryProvider()).toBe(deepseek);
    });

    it('returns openrouter if OPENROUTER_API_KEY is set and DEEPSEEK_API_KEY is not', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', '');
      vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
      expect(getPrimaryProvider()).toBe(openrouter);
    });

    it('throws an error if no API keys are set', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', '');
      vi.stubEnv('OPENROUTER_API_KEY', '');
      expect(() => getPrimaryProvider()).toThrow('No AI provider configured. Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY.');
    });
  });

  describe('listAvailableProviders', () => {
    it('returns deepseek if only DEEPSEEK_API_KEY is set', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', 'test-key');
      vi.stubEnv('OPENROUTER_API_KEY', '');
      expect(listAvailableProviders()).toEqual(['deepseek']);
    });

    it('returns openrouter if only OPENROUTER_API_KEY is set', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', '');
      vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
      expect(listAvailableProviders()).toEqual(['openrouter']);
    });

    it('returns both if both keys are set', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', 'test-key');
      vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
      expect(listAvailableProviders()).toEqual(['deepseek', 'openrouter']);
    });

    it('returns empty array if no keys are set', () => {
      vi.stubEnv('DEEPSEEK_API_KEY', '');
      vi.stubEnv('OPENROUTER_API_KEY', '');
      expect(listAvailableProviders()).toEqual([]);
    });
  });
});
