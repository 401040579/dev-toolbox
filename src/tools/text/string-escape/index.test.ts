import { describe, expect, it } from 'vitest';
import { escapeString, unescapeString } from './index';

describe('JavaScript string escaping', () => {
  it('preserves ordinary text without adding backspace escapes at word boundaries', () => {
    expect(escapeString('hello world! 你好 🌍', 'javascript')).toBe('hello world! 你好 🌍');
  });

  it('escapes actual control characters, quotes and backslashes', () => {
    expect(escapeString('\b\n\r\t\f\'"\\', 'javascript')).toBe(String.raw`\b\n\r\t\f\'\"\\`);
  });

  it('decodes supported escape sequences', () => {
    expect(unescapeString(String.raw`\b\n\r\t\f\'\"\\`, 'javascript')).toBe('\b\n\r\t\f\'"\\');
  });

  it.each(['n', 'r', 't', 'f', 'b', '"', "'"])(
    'preserves a literal backslash before %s',
    (character) => {
      expect(unescapeString('\\\\' + character, 'javascript')).toBe('\\' + character);
    },
  );

  it('decodes a control escape after an escaped backslash', () => {
    expect(unescapeString(String.raw`\\\n`, 'javascript')).toBe('\\\n');
  });

  it('preserves unsupported escapes and a trailing backslash', () => {
    const input = String.raw`\x41\u0041\q` + '\\';
    expect(unescapeString(input, 'javascript')).toBe(input);
  });

  it.each([
    '',
    'hello',
    String.raw`C:\new\report.txt`,
    '\\n\n\\t\t\\b\b',
    '\'"\\\\\\',
    '你好 🌍',
  ])('round-trips %j', (input) => {
    expect(unescapeString(escapeString(input, 'javascript'), 'javascript')).toBe(input);
  });
});
