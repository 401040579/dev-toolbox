import { describe, expect, it } from 'vitest';
import { buildQueryString, parseQueryString } from './index';

describe('query parameter keys', () => {
  it.each(Object.getOwnPropertyNames(Object.prototype))('parses %s as an own key with repeated values', (key) => {
    const parsed = parseQueryString(`${encodeURIComponent(key)}=first&${encodeURIComponent(key)}=second`);
    expect(Object.prototype.hasOwnProperty.call(parsed, key)).toBe(true);
    expect(Object.entries(parsed)).toEqual([[key, ['first', 'second']]]);
    expect(buildQueryString(parsed)).toBe(`${encodeURIComponent(key)}=first&${encodeURIComponent(key)}=second`);
  });

  it('preserves grouping, key order, empty values and query-string encoding semantics', () => {
    const parsed = parseQueryString('?constructor=first&normal=a+b&%5F%5Fproto%5F%5F=%E4%BD%A0%E5%A5%BD%20%26%3D&constructor=second&toString=&bare&=ignored');
    expect(Object.entries(parsed)).toEqual([
      ['constructor', ['first', 'second']],
      ['normal', ['a+b']],
      ['__proto__', ['你好 &=']],
      ['toString', ['']],
      ['bare', ['']],
    ]);
    expect(buildQueryString(parsed)).toBe('constructor=first&constructor=second&normal=a%2Bb&__proto__=%E4%BD%A0%E5%A5%BD%20%26%3D&toString=&bare=');
  });

  it('builds own keys from JSON without including inherited keys', () => {
    const params = JSON.parse('{"constructor":["a","b"],"__proto__":["x y"],"toString":[""]}');
    expect(buildQueryString(params)).toBe('constructor=a&constructor=b&__proto__=x%20y&toString=');
    expect(buildQueryString(Object.assign(Object.create({ inherited: ['skip'] }), { own: ['keep'] }))).toBe('own=keep');
  });

  it('keeps empty-input, malformed-encoding and numeric-key ordering behavior', () => {
    expect(Object.entries(parseQueryString(''))).toEqual([]);
    expect(Object.entries(parseQueryString('?'))).toEqual([]);
    expect(() => parseQueryString('key=%ZZ')).toThrow(URIError);
    expect(() => parseQueryString('%ZZ=value')).toThrow(URIError);
    expect(buildQueryString(parseQueryString('2=b&1=a&2=c'))).toBe('1=a&2=b&2=c');
  });
});
