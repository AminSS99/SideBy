import { describe, it, expect } from 'vitest';
import { sanitizeLlmText, sanitizeLlmStringArray } from '../sanitize';

describe('sanitizeLlmText', () => {
  it('returns clean text unmodified', () => {
    expect(sanitizeLlmText('Hello world!')).toBe('Hello world!');
    expect(sanitizeLlmText('Just a normal string with numbers 123.')).toBe('Just a normal string with numbers 123.');
  });

  it('strips <script> tags and their contents', () => {
    expect(sanitizeLlmText('Hello <script>alert(1);</script>World')).toBe('Hello World');
    expect(sanitizeLlmText('<SCRIPT type="text/javascript">steal()</SCRIPT>')).toBe('');
    expect(sanitizeLlmText('Start <script src="evil.js" /> End')).toBe('Start  End');
  });

  it('strips <style> tags and their contents', () => {
    expect(sanitizeLlmText('Hello <style>body { display: none; }</style>World')).toBe('Hello World');
    expect(sanitizeLlmText('<STYLE>...</STYLE>')).toBe('');
  });

  it('strips regular HTML tags but keeps their content', () => {
    expect(sanitizeLlmText('<b>Bold</b> and <i>italic</i>')).toBe('Bold and italic');
    expect(sanitizeLlmText('<a href="https://example.com">Link</a>')).toBe('Link');
    expect(sanitizeLlmText('<div><p>Nested</p></div>')).toBe('Nested');
  });

  it('removes onEvent= handlers', () => {
    expect(sanitizeLlmText('<a onclick="alert(1)" href="#">Click</a>')).toBe('Click');
    expect(sanitizeLlmText('<img src="x" onerror="alert(1)">')).toBe('');
  });

  it('removes javascript: protocols in href/src', () => {
    expect(sanitizeLlmText('<a href="javascript:alert(1)">Click</a>')).toBe('Click');
    expect(sanitizeLlmText('<img src="javascript:evil()">')).toBe('');
  });

  it('strips control characters', () => {
    const withNull = 'Null\x00Char';
    expect(sanitizeLlmText(withNull)).toBe('NullChar');

    const withEscape = 'Esc\x1BChar';
    expect(sanitizeLlmText(withEscape)).toBe('EscChar');

    // Tab and newline should remain
    expect(sanitizeLlmText('Keep\tTabs')).toBe('Keep\tTabs');
    expect(sanitizeLlmText('Keep\nNewlines')).toBe('Keep\nNewlines');
  });

  it('truncates to maxLength', () => {
    const longString = 'a'.repeat(10000);
    expect(sanitizeLlmText(longString).length).toBe(8000);
    expect(sanitizeLlmText(longString, 10).length).toBe(10);
  });

  it('trims whitespace from start and end', () => {
    expect(sanitizeLlmText('   Trim me   ')).toBe('Trim me');
    expect(sanitizeLlmText('\n\nTrim me\n\n')).toBe('Trim me');
  });
});

describe('sanitizeLlmStringArray', () => {
  it('sanitizes each item in the array', () => {
    const input = ['Normal', '<b>Bold</b>', '<script>alert(1)</script>Bad'];
    expect(sanitizeLlmStringArray(input)).toEqual(['Normal', 'Bold', 'Bad']);
  });

  it('removes empty items after sanitization', () => {
    const input = ['Valid', '<script>alert(1)</script>', '   ', 'Another Valid'];
    expect(sanitizeLlmStringArray(input)).toEqual(['Valid', 'Another Valid']);
  });

  it('applies custom maxItemLength', () => {
    const input = ['Too long string', 'Short'];
    expect(sanitizeLlmStringArray(input, 5)).toEqual(['Too l', 'Short']);
  });
});
