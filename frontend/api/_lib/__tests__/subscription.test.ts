import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFreeLimits, normalizePlan } from '../subscription.js';

describe('subscription', () => {
  describe('getFreeLimits', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns default limits when env vars are not set', () => {
      // Clear specific env vars
      delete process.env.FREE_COMPARISONS_PER_DAY;
      delete process.env.FREE_FOLLOWUPS_PER_DAY;
      delete process.env.FREE_REFRESHES_PER_DAY;
      delete process.env.FREE_EXPORTS_PER_DAY;
      delete process.env.FREE_WATCHLISTS_PER_DAY;

      const limits = getFreeLimits();

      expect(limits).toEqual({
        comparisonsPerDay: 5,
        followUpsPerDay: 10,
        refreshesPerDay: 3,
        exportsPerDay: 10,
        watchlistsPerDay: 5,
      });
    });

    it('returns limits parsed from env vars when they are set', () => {
      process.env.FREE_COMPARISONS_PER_DAY = '10';
      process.env.FREE_FOLLOWUPS_PER_DAY = '20';
      process.env.FREE_REFRESHES_PER_DAY = '5';
      process.env.FREE_EXPORTS_PER_DAY = '15';
      process.env.FREE_WATCHLISTS_PER_DAY = '8';

      const limits = getFreeLimits();

      expect(limits).toEqual({
        comparisonsPerDay: 10,
        followUpsPerDay: 20,
        refreshesPerDay: 5,
        exportsPerDay: 15,
        watchlistsPerDay: 8,
      });
    });

    it('handles non-integer values or garbage in env vars using Number()', () => {
       process.env.FREE_COMPARISONS_PER_DAY = '10.5';
       process.env.FREE_FOLLOWUPS_PER_DAY = 'garbage'; // Number('garbage') is NaN

       const limits = getFreeLimits();

       expect(limits.comparisonsPerDay).toBe(10.5);
       expect(limits.followUpsPerDay).toBeNaN();
    });
  });

  describe('normalizePlan', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return "free" when productId is null, undefined, or empty', () => {
      expect(normalizePlan(null)).toBe('free');
      expect(normalizePlan(undefined)).toBe('free');
      expect(normalizePlan('')).toBe('free');
    });

    it('should return "pro" when productId matches DODO_PRO_PRODUCT_ID', () => {
      process.env.DODO_PRO_PRODUCT_ID = 'test-pro-id';
      expect(normalizePlan('test-pro-id')).toBe('pro');
    });

    it('should return "team" when productId matches DODO_TEAM_PRODUCT_ID', () => {
      process.env.DODO_TEAM_PRODUCT_ID = 'test-team-id';
      expect(normalizePlan('test-team-id')).toBe('team');
    });

    it('should return "business" when productId matches DODO_ENTERPRISE_PRODUCT_ID', () => {
      process.env.DODO_ENTERPRISE_PRODUCT_ID = 'test-enterprise-id';
      expect(normalizePlan('test-enterprise-id')).toBe('business');
    });

    it('should return "free" when productId does not match any known product ID', () => {
      process.env.DODO_PRO_PRODUCT_ID = 'test-pro-id';
      process.env.DODO_TEAM_PRODUCT_ID = 'test-team-id';
      process.env.DODO_ENTERPRISE_PRODUCT_ID = 'test-enterprise-id';
      expect(normalizePlan('unknown-id')).toBe('free');
    });
  });
});
