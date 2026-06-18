import { describe, it, expect } from 'vitest';
import { validateComparisonInput, sanitizeInput } from '../optimizations';

describe('validateComparisonInput', () => {
  it('should return valid true for two different, valid strings', () => {
    const result = validateComparisonInput('Apple', 'Banana');
    expect(result).toEqual({ valid: true });
  });

  it('should return invalid when fields are missing or empty', () => {
    expect(validateComparisonInput('', 'Banana')).toEqual({ valid: false, error: 'Both fields are required' });
    expect(validateComparisonInput('Apple', '')).toEqual({ valid: false, error: 'Both fields are required' });
    expect(validateComparisonInput('', '')).toEqual({ valid: false, error: 'Both fields are required' });
  });

  it('should return invalid when items are less than 2 characters', () => {
    expect(validateComparisonInput('A', 'Banana')).toEqual({ valid: false, error: 'Items must be at least 2 characters' });
    expect(validateComparisonInput('Apple', 'B')).toEqual({ valid: false, error: 'Items must be at least 2 characters' });
  });

  it('should return invalid when items are the same (case insensitive)', () => {
    expect(validateComparisonInput('Apple', 'apple')).toEqual({ valid: false, error: 'Items must be different' });
    expect(validateComparisonInput('Apple', 'Apple')).toEqual({ valid: false, error: 'Items must be different' });
  });

  it('should handle inputs that become invalid after sanitization', () => {
    // <a> is stripped to 'a', failing the length check instead of required check
    expect(validateComparisonInput('<a>', 'Banana')).toEqual({ valid: false, error: 'Items must be at least 2 characters' });

    // <> is stripped to empty string -> fails required check
    expect(validateComparisonInput('<>', 'Banana')).toEqual({ valid: false, error: 'Both fields are required' });
  });
});

describe('sanitizeInput', () => {
  it('should remove < and > characters', () => {
    expect(sanitizeInput('<script>')).toBe('script');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it('should remove inline event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('onmouseover=alert(1)')).toBe('alert(1)');
  });

  it('should encode html entities for &, ", \'', () => {
    expect(sanitizeInput('cats & dogs')).toBe('cats &amp; dogs');
    expect(sanitizeInput('"quotes"')).toBe('&quot;quotes&quot;');
    expect(sanitizeInput("'quotes'")).toBe('&#x27;quotes&#x27;');
  });

  it('should trim and substring to 100 characters max', () => {
    const longString = 'a'.repeat(150);
    expect(sanitizeInput(longString).length).toBe(100);
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });
});
