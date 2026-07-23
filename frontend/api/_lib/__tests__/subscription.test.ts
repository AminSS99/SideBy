import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFreeLimits, getPlanLimits, type BillingPlan } from '../subscription.js';

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

  describe('getPlanLimits', () => {
    it('returns free limits for free plan', () => {
      const limits = getPlanLimits('free');
      expect(limits).toEqual(getFreeLimits());
    });

    it('returns unlimited limits for paid plans', () => {
      const paidPlans: BillingPlan[] = ['pro', 'team', 'business'];

      for (const plan of paidPlans) {
        const limits = getPlanLimits(plan);
        expect(limits).toEqual({
          comparisonsPerDay: Number.MAX_SAFE_INTEGER,
          followUpsPerDay: Number.MAX_SAFE_INTEGER,
          refreshesPerDay: Number.MAX_SAFE_INTEGER,
          exportsPerDay: Number.MAX_SAFE_INTEGER,
          watchlistsPerDay: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  });
});
