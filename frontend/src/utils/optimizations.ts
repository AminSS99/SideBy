/**
 * Performance and Security Utilities
 * Optimizations for mobile devices and input sanitization
 */

/**
 * Check if device prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  return isTouchDevice || isSmallScreen;
};

/**
 * Get optimized animation config based on device
 */
export const getAnimationConfig = () => {
  const mobile = isMobileDevice();
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return {
      duration: 0,
      stagger: 0,
      enableParticles: false,
      enableGlow: false,
      spring: { duration: 0 },
    };
  }

  if (mobile) {
    return {
      duration: 0.2,
      stagger: 0.03,
      enableParticles: false, // No particles on mobile
      enableGlow: true,
      spring: { type: "spring", damping: 25, stiffness: 300 },
    };
  }

  return {
    duration: 0.5,
    stagger: 0.08,
    enableParticles: true,
    enableGlow: true,
    spring: { type: "spring", damping: 15, stiffness: 200 },
  };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, 100) // Max 100 characters
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Validate comparison input
 */
export const validateComparisonInput = (itemA: string, itemB: string): { valid: boolean; error?: string } => {
  const sanitizedA = sanitizeInput(itemA);
  const sanitizedB = sanitizeInput(itemB);

  if (!sanitizedA || !sanitizedB) {
    return { valid: false, error: 'Both fields are required' };
  }

  if (sanitizedA.length < 2 || sanitizedB.length < 2) {
    return { valid: false, error: 'Items must be at least 2 characters' };
  }

  if (sanitizedA.toLowerCase() === sanitizedB.toLowerCase()) {
    return { valid: false, error: 'Items must be different' };
  }

  return { valid: true };
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return this.timestamps.length < this.maxRequests;
  }

  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  getTimeUntilNext(): number {
    if (this.canMakeRequest()) return 0;
    const oldest = this.timestamps[0];
    return oldest + this.windowMs - Date.now();
  }
}

// Singleton rate limiter for comparisons (5 per minute)
export const comparisonLimiter = new RateLimiter(5, 60000);
