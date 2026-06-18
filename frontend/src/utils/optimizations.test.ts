import { describe, it, expect } from 'vitest';
import { sanitizeInput } from './optimizations';

describe('sanitizeInput', () => {
  it('handles null/undefined/empty input', () => {
    // @ts-expect-error Testing invalid runtime input
    expect(sanitizeInput(null)).toBe('');
    // @ts-expect-error Testing invalid runtime input
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput('')).toBe('');
    // @ts-expect-error Testing invalid runtime input
    expect(sanitizeInput(123)).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
    expect(sanitizeInput('\t\nhello\n\t')).toBe('hello');
  });

  it('truncates to 100 characters', () => {
    const longString = 'a'.repeat(150);
    expect(sanitizeInput(longString)).toHaveLength(100);
    expect(sanitizeInput(longString)).toBe('a'.repeat(100));
  });

  it('removes angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(&quot;xss&quot;)/script');
    expect(sanitizeInput('<div>test</div>')).toBe('divtest/div');
    expect(sanitizeInput('a < b > c')).toBe('a  b  c');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert("xss")')).toBe('alert(&quot;xss&quot;)');
    expect(sanitizeInput('JaVaScRiPt:alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('javascript:void(0)')).toBe('void(0)');
  });

  it('removes event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('onMouseOver=foo()')).toBe('foo()');
    expect(sanitizeInput('ONERROR=alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('don=do')).toBe('don=do'); // Testing safe words that start with "on"
  });

  it('escapes special characters', () => {
    expect(sanitizeInput('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(sanitizeInput('He said "Hello"')).toBe('He said &quot;Hello&quot;');
  });

  it('handles combination of attacks', () => {
    const attack = '<a href="javascript:alert(1)" onmouseover="alert(1)">Click Me & see</a>';
    expect(sanitizeInput(attack)).toBe('a href=&quot;alert(1)&quot; &quot;alert(1)&quot;Click Me &amp; see/a');
  });
});
