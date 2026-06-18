import { describe, it, expect } from 'vitest';
import { validateComparisonInput } from '../optimizations';

describe('validateComparisonInput', () => {
  it('should return valid true for two different strings >= 2 characters', () => {
    const result = validateComparisonInput('Apple', 'Banana');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid false if either input is empty', () => {
    const result1 = validateComparisonInput('', 'Banana');
    expect(result1.valid).toBe(false);
    expect(result1.error).toBe('Both fields are required');

    const result2 = validateComparisonInput('Apple', '');
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe('Both fields are required');

    const result3 = validateComparisonInput('', '');
    expect(result3.valid).toBe(false);
    expect(result3.error).toBe('Both fields are required');
  });

  it('should return valid false if either input is less than 2 characters after sanitization', () => {
    const result1 = validateComparisonInput('A', 'Banana');
    expect(result1.valid).toBe(false);
    expect(result1.error).toBe('Items must be at least 2 characters');

    const result2 = validateComparisonInput('Apple', 'B');
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe('Items must be at least 2 characters');

    // Tests whitespace trimming which is part of sanitizeInput
    const result3 = validateComparisonInput(' A ', 'Banana');
    expect(result3.valid).toBe(false);
    expect(result3.error).toBe('Items must be at least 2 characters');
  });

  it('should return valid false if inputs are identical (case-insensitive)', () => {
    const result1 = validateComparisonInput('Apple', 'Apple');
    expect(result1.valid).toBe(false);
    expect(result1.error).toBe('Items must be different');

    const result2 = validateComparisonInput('Apple', 'apple');
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe('Items must be different');
  });

  it('should sanitize input before comparison', () => {
    // Tests behavior when input only contains angle brackets
    const result1 = validateComparisonInput('<>', 'Banana');
    expect(result1.valid).toBe(false);
    expect(result1.error).toBe('Both fields are required');

    const result2 = validateComparisonInput('<A>', 'Banana');
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe('Items must be at least 2 characters');
  });
});
