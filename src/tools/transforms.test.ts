import { describe, it, expect } from 'vitest';

// Base64
import base64Tool from './encoding/base64';

describe('Base64', () => {
  const encode = base64Tool.transforms![0]!.transform;
  const decode = base64Tool.transforms![1]!.transform;

  it('encodes plain ASCII', () => {
    expect(encode('hello')).toBe('aGVsbG8=');
  });

  it('decodes plain ASCII', () => {
    expect(decode('aGVsbG8=')).toBe('hello');
  });

  it('roundtrips UTF-8', () => {
    const input = '你好世界 🌍';
    expect(decode(encode(input) as string)).toBe(input);
  });

  it('handles empty string', () => {
    expect(encode('')).toBe('');
    expect(decode('')).toBe('');
  });

  it('throws on invalid base64', () => {
    expect(() => decode('not-valid-base64!!!')).toThrow();
  });
});

// URL Encode
import urlEncodeTool from './encoding/url-encode';

describe('URL Encode/Decode', () => {
  const encode = urlEncodeTool.transforms![0]!.transform;
  const decode = urlEncodeTool.transforms![1]!.transform;

  it('encodes special characters', () => {
    expect(encode('hello world&foo=bar')).toBe('hello%20world%26foo%3Dbar');
  });

  it('decodes percent-encoded string', () => {
    expect(decode('hello%20world%26foo%3Dbar')).toBe('hello world&foo=bar');
  });

  it('roundtrips Unicode', () => {
    const input = '日本語テスト';
    expect(decode(encode(input) as string)).toBe(input);
  });

  it('throws on invalid encoding', () => {
    expect(() => decode('%ZZ')).toThrow();
  });
});

// JWT Decode
import jwtTool from './encoding/jwt-decode';

describe('JWT Decode', () => {
  const decode = jwtTool.transforms![0]!.transform;

  it('decodes a valid JWT', () => {
    // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"sub":"1234567890","name":"John","iat":1516239022}
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = JSON.parse(decode(token) as string);
    expect(result.header.alg).toBe('HS256');
    expect(result.payload.name).toBe('John');
  });

  it('throws on invalid JWT (wrong parts)', () => {
    expect(() => decode('not.a.valid.jwt.token')).toThrow();
  });

  it('throws on non-JWT string', () => {
    expect(() => decode('hello')).toThrow();
  });
});

// Epoch Converter
import epochTool from './time/epoch-converter';

describe('Epoch Converter', () => {
  const epochToIso = epochTool.transforms![0]!.transform;
  const dateToEpoch = epochTool.transforms![1]!.transform;

  it('converts seconds epoch to ISO', () => {
    const result = epochToIso('0');
    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });

  it('auto-detects milliseconds', () => {
    const result = epochToIso('1700000000000');
    // Should be same as seconds 1700000000
    expect(result).toContain('2023-11-14');
  });

  it('converts ISO date to epoch', () => {
    const result = dateToEpoch('1970-01-01T00:00:00.000Z');
    expect(result).toBe('0');
  });

  it('throws on invalid number', () => {
    expect(() => epochToIso('not-a-number')).toThrow();
  });

  it('throws on invalid date', () => {
    expect(() => dateToEpoch('invalid-date')).toThrow();
  });
});

// JSON Formatter
import jsonFormatterTool from './json/json-formatter';

describe('JSON Formatter', () => {
  const prettify = jsonFormatterTool.transforms![0]!.transform;
  const minify = jsonFormatterTool.transforms![1]!.transform;

  it('prettifies JSON', () => {
    const result = prettify('{"a":1,"b":2}');
    expect(result).toContain('\n');
    expect(JSON.parse(result as string)).toEqual({ a: 1, b: 2 });
  });

  it('minifies JSON', () => {
    const result = minify('{ "a" : 1 , "b" : 2 }');
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('throws on invalid JSON', () => {
    expect(() => prettify('not json')).toThrow();
  });
});

// JSON → YAML
import jsonYamlTool from './json/json-yaml';

describe('JSON → YAML', () => {
  const toYaml = jsonYamlTool.transforms![0]!.transform;

  it('converts simple object', () => {
    const result = toYaml('{"name":"test","count":42}') as string;
    expect(result).toContain('name: test');
    expect(result).toContain('count: 42');
  });

  it('converts arrays', () => {
    const result = toYaml('{"items":[1,2,3]}') as string;
    expect(result).toContain('items:');
    expect(result).toContain('- 1');
  });

  it('handles null and booleans', () => {
    const result = toYaml('{"a":null,"b":true,"c":false}') as string;
    expect(result).toContain('a: null');
    expect(result).toContain('b: true');
    expect(result).toContain('c: false');
  });

  it('throws on invalid JSON input', () => {
    expect(() => toYaml('not json')).toThrow();
  });
});

// Case Converter
import caseConverterTool from './text/case-converter';

describe('Case Converter', () => {
  const transforms = caseConverterTool.transforms!;
  const findTransform = (id: string) => transforms.find((t) => t.id === id)!.transform;

  it('to-uppercase', () => {
    expect(findTransform('to-uppercase')('hello world')).toBe('HELLO WORLD');
  });

  it('to-lowercase', () => {
    expect(findTransform('to-lowercase')('HELLO WORLD')).toBe('hello world');
  });

  it('to-title-case', () => {
    expect(findTransform('to-title-case')('hello world foo')).toBe('Hello World Foo');
  });

  it('to-camel-case', () => {
    expect(findTransform('to-camel-case')('hello world')).toBe('helloWorld');
  });

  it('to-snake-case', () => {
    expect(findTransform('to-snake-case')('helloWorld')).toBe('hello_world');
  });

  it('to-kebab-case', () => {
    expect(findTransform('to-kebab-case')('helloWorld')).toBe('hello-world');
  });

  it('to-pascal-case', () => {
    expect(findTransform('to-pascal-case')('hello world')).toBe('HelloWorld');
  });

  it('to-constant-case', () => {
    expect(findTransform('to-constant-case')('helloWorld')).toBe('HELLO_WORLD');
  });
});

// Line Tools
import lineToolsTool from './text/line-tools';

describe('Line Tools', () => {
  const transforms = lineToolsTool.transforms!;
  const findTransform = (id: string) => transforms.find((t) => t.id === id)!.transform;

  it('sort-lines', () => {
    expect(findTransform('sort-lines')('c\na\nb')).toBe('a\nb\nc');
  });

  it('unique-lines', () => {
    expect(findTransform('unique-lines')('a\nb\na\nc\nb')).toBe('a\nb\nc');
  });

  it('reverse-lines', () => {
    expect(findTransform('reverse-lines')('a\nb\nc')).toBe('c\nb\na');
  });

  it('handles empty input', () => {
    expect(findTransform('sort-lines')('')).toBe('');
  });

  it('handles single line', () => {
    expect(findTransform('reverse-lines')('only one')).toBe('only one');
  });
});

// Hash Generator (async)
import hashTool from './generators/hash';

describe('Hash Generator', () => {
  const sha256 = hashTool.transforms![0]!.transform;
  const sha512 = hashTool.transforms![1]!.transform;
  const sha1 = hashTool.transforms![2]!.transform;

  it('computes SHA-256', async () => {
    const result = await sha256('hello');
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('computes SHA-512', async () => {
    const result = await sha512('hello');
    expect(typeof result).toBe('string');
    expect((result as string).length).toBe(128); // SHA-512 = 128 hex chars
  });

  it('computes SHA-1', async () => {
    const result = await sha1('hello');
    expect(result).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('different inputs produce different hashes', async () => {
    const h1 = await sha256('hello');
    const h2 = await sha256('world');
    expect(h1).not.toBe(h2);
  });
});

// UUID Generator
import uuidTool from './generators/uuid';

describe('UUID Generator', () => {
  const generate = uuidTool.transforms![0]!.transform;

  it('generates valid UUID v4 format', () => {
    const uuid = generate('') as string;
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique UUIDs', () => {
    const a = generate('');
    const b = generate('');
    expect(a).not.toBe(b);
  });
});

// Registry
import { getToolList, getTool, getTransform } from './registry';

describe('Tool Registry', () => {
  it('returns all registered tools', () => {
    const tools = getToolList();
    expect(tools.length).toBeGreaterThanOrEqual(16);
  });

  it('finds tool by ID', () => {
    const tool = getTool('base64');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('Base64 Encode/Decode');
  });

  it('returns undefined for unknown tool', () => {
    expect(getTool('nonexistent')).toBeUndefined();
  });

  it('finds transform by ID', () => {
    const transform = getTransform('base64-encode');
    expect(transform).toBeDefined();
    expect(transform?.name).toBe('Base64 Encode');
  });

  it('returns undefined for unknown transform', () => {
    expect(getTransform('nonexistent')).toBeUndefined();
  });
});
