import { describe, expect, it } from 'vitest';
import { parseURL } from './index';

describe('URL query parameter keys', () => {
  it.each(Object.getOwnPropertyNames(Object.prototype))('accepts a valid URL with repeated %s keys', (key) => {
    const parsed = parseURL(`https://example.com/path?${encodeURIComponent(key)}=first&${encodeURIComponent(key)}=second#part`);
    expect(parsed).not.toBeNull();
    expect(Object.prototype.hasOwnProperty.call(parsed!.searchParams, key)).toBe(true);
    expect(Object.entries(parsed!.searchParams)).toEqual([[key, ['first', 'second']]]);
    expect(parsed!.pathname).toBe('/path');
    expect(parsed!.hash).toBe('#part');
  });

  it('preserves URLSearchParams decoding, grouped values, empty keys and URL fields', () => {
    const input = 'https://example.com:8443/path?constructor=first&normal=a+b&%5F%5Fproto%5F%5F=%E4%BD%A0%E5%A5%BD%20%26%3D&constructor=second&toString=&=empty#part';
    const parsed = parseURL(input);
    expect(parsed).not.toBeNull();
    expect(Object.entries(parsed!.searchParams)).toEqual([
      ['constructor', ['first', 'second']],
      ['normal', ['a b']],
      ['__proto__', ['你好 &=']],
      ['toString', ['']],
      ['', ['empty']],
    ]);
    expect(parsed!.href).toBe(input);
    expect(parsed!.origin).toBe('https://example.com:8443');
    expect(parsed!.port).toBe('8443');
    expect(parsed!.hash).toBe('#part');
  });

  it('keeps invalid-URL and empty-query behavior', () => {
    expect(parseURL('not a URL')).toBeNull();
    expect(Object.entries(parseURL('https://example.com/')!.searchParams)).toEqual([]);
  });
});
