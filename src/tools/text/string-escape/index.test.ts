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

describe('HTML string escaping', () => {
  it.each([
    '&lt;demo&gt;',
    '&quot;quoted&quot;',
    '&#39;single&#x27;',
    '&#65;&#00066;',
    '&amp; &lt; &#39;',
    'raw & < > "\' 你好 🌍',
    '',
    '&copy; &unknown; &#x41; &AMP; &lt',
    '&amp;lt; &amp;#65;',
  ])('round-trips literal text %j', (input) => {
    expect(unescapeString(escapeString(input, 'html'), 'html')).toBe(input);
  });

  it('decodes each entity from the input once, including mixed literal references', () => {
    expect(unescapeString('&amp;lt; &lt; &amp;#65; &#65; &amp;#x27; &#x27;', 'html'))
      .toBe("&lt; < &#65; A &#x27; '");
  });

  it('keeps existing supported named, decimal and apostrophe entities', () => {
    expect(unescapeString('&amp;&lt;&gt;&quot;&#39;&#x27;&#00065;', 'html')).toBe('&<>"\'\'A');
  });

  it('keeps unsupported or incomplete references unchanged', () => {
    const input = '&copy; &unknown; &LT; &#x41; &#; &#nope; &lt &amp';
    expect(unescapeString(input, 'html')).toBe(input);
  });

  it('lets callers explicitly decode a second layer with a second call', () => {
    const input = '<tag>';
    const twiceEscaped = escapeString(escapeString(input, 'html'), 'html');
    const first = unescapeString(twiceEscaped, 'html');
    expect(first).toBe('&lt;tag&gt;');
    expect(unescapeString(first, 'html')).toBe(input);
  });
});
