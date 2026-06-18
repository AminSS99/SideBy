import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  prefersReducedMotion,
  isMobileDevice,
  getAnimationConfig,
  sanitizeInput,
  validateComparisonInput,
  debounce,
  RateLimiter,
  comparisonLimiter,
} from './optimizations';

describe('optimizations utilities', () => {
  describe('prefersReducedMotion', () => {
    let originalWindow: Window & typeof globalThis;
    let originalMatchMedia: ((query: string) => MediaQueryList) | undefined;

    beforeEach(() => {
      originalWindow = global.window;
      if (global.window) {
          originalMatchMedia = global.window.matchMedia;
      }
    });

    afterEach(() => {
      global.window = originalWindow;
      if (global.window) {
          global.window.matchMedia = originalMatchMedia as any;
      }
      vi.unstubAllGlobals();
    });

    it('returns false when window is undefined', () => {
      // @ts-ignore
      delete global.window;
      expect(prefersReducedMotion()).toBe(false);
    });

    it('returns true when media query matches', () => {
      // Create a mock window with matchMedia if it doesn't exist
      if (!global.window) {
        // @ts-ignore
        global.window = {};
      }
      global.window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
      }));
      expect(prefersReducedMotion()).toBe(true);
    });

    it('returns false when media query does not match', () => {
      if (!global.window) {
        // @ts-ignore
        global.window = {};
      }
      global.window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
      }));
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('isMobileDevice', () => {
    let originalWindow: Window & typeof globalThis;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
      vi.unstubAllGlobals();
    });

    it('returns false when window is undefined', () => {
      // @ts-ignore
      delete global.window;
      expect(isMobileDevice()).toBe(false);
    });

    it('returns true for touch devices', () => {
      vi.stubGlobal('window', { innerWidth: 1024, ontouchstart: null });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true when navigator has touch points', () => {
      vi.stubGlobal('navigator', { maxTouchPoints: 1 });
      vi.stubGlobal('window', { innerWidth: 1024 });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for small screens', () => {
      vi.stubGlobal('navigator', { maxTouchPoints: 0 });
      vi.stubGlobal('window', { innerWidth: 500 });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns false for large screens without touch', () => {
      vi.stubGlobal('navigator', { maxTouchPoints: 0 });
      vi.stubGlobal('window', { innerWidth: 1024 });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('returns empty string for falsy input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as unknown as string)).toBe('');
      expect(sanitizeInput(undefined as unknown as string)).toBe('');
    });

    it('trims input', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('truncates to 100 characters', () => {
      const longString = 'a'.repeat(150);
      expect(sanitizeInput(longString).length).toBe(100);
    });

    it('removes angle brackets', () => {
      expect(sanitizeInput('hello <script>alert("xss")</script> world')).toBe('hello scriptalert(&quot;xss&quot;)/script world');
    });

    it('removes javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert(&quot;xss&quot;)');
      expect(sanitizeInput('JaVaScRiPt:alert(1)')).toBe('alert(1)');
    });

    it('removes event handlers', () => {
      expect(sanitizeInput('onclick=alert(1) onerror=alert(2)')).toBe('alert(1) alert(2)');
    });

    it('escapes special characters', () => {
      expect(sanitizeInput('a & b " c \' d')).toBe('a &amp; b &quot; c &#x27; d');
    });

    it('handles multiple security issues together', () => {
      expect(sanitizeInput(' <a href="javascript:alert(1)" onclick="steal()">click</a> ')).toBe('a href=&quot;alert(1)&quot; &quot;steal()&quot;click/a');
    });
  });

  describe('validateComparisonInput', () => {
    it('requires both fields', () => {
      expect(validateComparisonInput('', 'b')).toEqual({ valid: false, error: 'Both fields are required' });
      expect(validateComparisonInput('a', '')).toEqual({ valid: false, error: 'Both fields are required' });
      expect(validateComparisonInput('', '')).toEqual({ valid: false, error: 'Both fields are required' });
    });

    it('requires minimum length of 2 characters', () => {
      expect(validateComparisonInput('a', 'bc')).toEqual({ valid: false, error: 'Items must be at least 2 characters' });
      expect(validateComparisonInput('ab', 'c')).toEqual({ valid: false, error: 'Items must be at least 2 characters' });
    });

    it('requires items to be different', () => {
      expect(validateComparisonInput('react', 'react')).toEqual({ valid: false, error: 'Items must be different' });
      expect(validateComparisonInput('React', 'react')).toEqual({ valid: false, error: 'Items must be different' });
    });

    it('returns valid for good input', () => {
      expect(validateComparisonInput('React', 'Vue')).toEqual({ valid: true });
    });

    it('handles malicious input gracefully', () => {
        expect(validateComparisonInput('<script>', '<script>')).toEqual({ valid: false, error: 'Items must be different' }); // sanitization replaces '<' and '>' to become 'script' and 'script'
        expect(validateComparisonInput('<script>ab', '<script>ab')).toEqual({ valid: false, error: 'Items must be different' }); // becomes 'scriptab' and 'scriptab'
        expect(validateComparisonInput('<script>a', '<script>b')).toEqual({ valid: true }); // becomes 'scripta' and 'scriptb', valid
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls within wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to original function', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test', 123);
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('allows requests within limit', () => {
      const limiter = new RateLimiter(2, 1000);
      expect(limiter.canMakeRequest()).toBe(true);
      limiter.recordRequest();
      expect(limiter.canMakeRequest()).toBe(true);
      limiter.recordRequest();
      expect(limiter.canMakeRequest()).toBe(false);
    });

    it('allows requests after window expires', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.recordRequest();
      expect(limiter.canMakeRequest()).toBe(false);

      vi.advanceTimersByTime(1001);
      expect(limiter.canMakeRequest()).toBe(true);
    });

    it('calculates time until next request correctly', () => {
      const limiter = new RateLimiter(1, 1000);

      // Initially, we can make a request, so time until next is 0
      expect(limiter.getTimeUntilNext()).toBe(0);

      const now = Date.now();
      limiter.recordRequest(); // record at `now`

      // Immediately after, we have to wait 1000ms
      expect(limiter.getTimeUntilNext()).toBe(1000);

      // Advance time by 400ms
      vi.advanceTimersByTime(400);

      // Now we have to wait 600ms
      expect(limiter.getTimeUntilNext()).toBe(600);

      // Advance time by 601ms
      vi.advanceTimersByTime(601);

      // Window expired, can make request, time until next is 0
      expect(limiter.getTimeUntilNext()).toBe(0);
    });
  });

  describe('comparisonLimiter', () => {
      it('is defined', () => {
          expect(comparisonLimiter).toBeDefined();
      });
  });

  describe('getAnimationConfig', () => {
      let originalWindow: Window & typeof globalThis;
      let originalMatchMedia: ((query: string) => MediaQueryList) | undefined;

      beforeEach(() => {
        originalWindow = global.window;
        if (global.window) {
            originalMatchMedia = global.window.matchMedia;
        }
      });

      afterEach(() => {
        global.window = originalWindow;
        if (global.window) {
            global.window.matchMedia = originalMatchMedia as any;
        }
        vi.unstubAllGlobals();
      });

      it('returns reduced motion config when prefers-reduced-motion matches', () => {
        if (!global.window) {
          // @ts-ignore
          global.window = {};
        }
        global.window.matchMedia = vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
        }));

        expect(getAnimationConfig()).toEqual({
          duration: 0,
          stagger: 0,
          enableParticles: false,
          enableGlow: false,
          spring: { duration: 0 },
        });
      });

      it('returns mobile config when device is mobile', () => {
        if (!global.window) {
          // @ts-ignore
          global.window = {};
        }
        global.window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: false,
        }));

        vi.stubGlobal('window', { ...global.window, innerWidth: 500, matchMedia: global.window.matchMedia });
        vi.stubGlobal('navigator', { maxTouchPoints: 1 });

        expect(getAnimationConfig()).toEqual({
          duration: 0.2,
          stagger: 0.03,
          enableParticles: false, // No particles on mobile
          enableGlow: true,
          spring: { type: "spring", damping: 25, stiffness: 300 },
        });
      });

      it('returns default config for desktop without reduced motion', () => {
        if (!global.window) {
          // @ts-ignore
          global.window = {};
        }
        global.window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: false,
        }));

        vi.stubGlobal('window', { ...global.window, innerWidth: 1024, matchMedia: global.window.matchMedia });
        vi.stubGlobal('navigator', { maxTouchPoints: 0 });

        expect(getAnimationConfig()).toEqual({
          duration: 0.5,
          stagger: 0.08,
          enableParticles: true,
          enableGlow: true,
          spring: { type: "spring", damping: 15, stiffness: 200 },
        });
      });
  });
});
