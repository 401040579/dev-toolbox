import { describe, expect, it } from 'vitest';
import { convert, parseTOML, stringifyTOML } from './conversion';
import { parseYaml } from '../json-yaml/conversion';
import { DATA_LIMITS } from '../json-yaml/structured-data';

describe('TOML semantic conversion', () => {
  const source = `title = "DEMO" # inline comment\nport = 8080 # listen port\npath = 'C:\\tmp'\nmessage = "a\\nb"\nmetadata = { status = "ok", flags = [true, false] }\n"a.b" = "literal key"\nserver.host = "localhost"\n\n[[items]]\nsku = "A"\nqty = 2\n[[items]]\nsku = "B"\nqty = 1\n`;
  const expected = {
    title: 'DEMO', port: 8080, path: 'C:\\tmp', message: 'a\nb', metadata: { status: 'ok', flags: [true, false] },
    'a.b': 'literal key', server: { host: 'localhost' }, items: [{ sku: 'A', qty: 2 }, { sku: 'B', qty: 1 }],
  };

  it('accepts inline comments, dotted/quoted keys, inline tables and arrays of tables', () => {
    expect(JSON.parse(convert(source, 'toml-to-json'))).toEqual(expected);
    expect(parseYaml(convert(source, 'toml-to-yaml'))).toEqual(expected);
  });

  it('keeps the same semantic YAML path in both tools', () => {
    const yaml = `items:\n  - sku: A\n    qty: 2\n  - sku: B\n    qty: 1\nempty: []\nconfig: {}\n"a:b": value\n`;
    expect(parseTOML(convert(yaml, 'yaml-to-toml'))).toEqual(parseYaml(yaml));
  });

  it.each([
    expected,
    { items: [], config: {}, tables: [{}, { empty: {} }], matrix: [[1, 2], [3]], value: 1e-8 },
    { 'a.b': 'x', '#': '#', '': '', 'a"b': 'quote"tab\tnewline\n', unicode: '你好🙂', control: '\u0000\u007f' },
    {},
  ])('round-trips JSON objects through TOML %#', (value) => {
    expect(JSON.parse(convert(convert(JSON.stringify(value), 'json-to-toml'), 'toml-to-json'))).toEqual(value);
  });

  it('preserves __proto__ and constructor.prototype as own data without prototype pollution', () => {
    const input = '[__proto__]\nauditMarker = "test"\n[constructor.prototype]\nauditMarker = "test"';
    const parsed = parseTOML(input);
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(true);
    expect(parsed).toEqual(JSON.parse('{"__proto__":{"auditMarker":"test"},"constructor":{"prototype":{"auditMarker":"test"}}}'));
    expect(parseTOML(stringifyTOML(parsed))).toEqual(parsed);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(Object.prototype).not.toHaveProperty('auditMarker');
    expect(Function.prototype).not.toHaveProperty('auditMarker');
  });

  it.each(['port = nope', 'a = 1\na = 2', '[broken', 'list = [1,', 'a = null', 'unexpected text'])('rejects malformed TOML %#', (input) => {
    expect(() => convert(input, 'toml-to-json')).toThrow();
  });

  it.each(['null', '[]', '[1,2]', '"string"', '42', '{"a":null}', '{"items":[null]}', '{"nest":{"value":null}}', '{"value":1e999}'])('rejects JSON that TOML cannot represent %#', (input) => {
    expect(() => convert(input, 'json-to-toml')).toThrow();
  });

  it.each(['a = nan', 'a = inf', 'a = -inf', 'a = 9007199254740993', 'a = 2026-01-02', 'a = 07:32:00.123456789'])('rejects TOML values JSON cannot preserve %#', (input) => {
    expect(() => convert(input, 'toml-to-json')).toThrow();
    expect(() => convert(input, 'toml-to-yaml')).toThrow();
  });

  it('rejects nulls in YAML rather than dropping their keys', () => {
    expect(() => convert('safe: 1\nnested: {value: null}', 'yaml-to-toml')).toThrow(/null/);
  });

  it('rejects lone Unicode surrogates instead of silently replacing them', () => {
    expect(() => stringifyTOML({ value: '\ud800' })).toThrow(/surrogate/);
    expect(() => stringifyTOML({ '\udfff': 'value' })).toThrow(/surrogate/);
  });

  it('applies size, nesting and value limits to TOML inputs', () => {
    expect(() => parseTOML(' '.repeat(DATA_LIMITS.inputBytes + 1))).toThrow(/1 MiB/);
    expect(() => parseTOML('value = ' + '['.repeat(65) + '1' + ']'.repeat(65))).toThrow();
    expect(() => parseTOML(`[${Array(65).fill('a').join('.')}]\nvalue = 1`)).toThrow(/levels/);
    expect(() => parseTOML('value = [' + Array(DATA_LIMITS.nodes).fill('0').join(',') + ']')).toThrow(/values/);
  });
});
