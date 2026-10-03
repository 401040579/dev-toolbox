import { describe, expect, it } from 'vitest';
import tool from './index';
import { convertJsonYaml, jsonToYaml, parseYaml } from './conversion';
import { DATA_LIMITS, normalizeJson, parseJson } from './structured-data';

describe('JSON/YAML semantic conversion', () => {
  const values = [
    { orderId: 'DEMO-1042', items: [{ sku: 'A', qty: 2 }, { sku: 'B', qty: 1 }], empty: [], config: {} },
    [{ a: 1 }, [], {}, null, ['line\nbreak', 'C:\\tmp', '\u0000\t"quote"']],
    { 'a:b': 'value', '# comment': '#text', '': '', 'true': 'true', 'False': 'False', '~': '~', '0': '01', 'date': '2026-01-02' },
    {}, [], null, true, 4.5, 'scalar',
  ];

  it.each(values)('round-trips JSON values %# without changing their shape', (value) => {
    const input = JSON.stringify(value);
    expect(JSON.parse(convertJsonYaml(convertJsonYaml(input, 'json-to-yaml'), 'yaml-to-json'))).toEqual(value);
  });

  it('uses the same conversion path in the UI and Pipeline transform', async () => {
    const input = JSON.stringify(values[0]);
    expect(await tool.transforms![0]!.transform(input)).toBe(convertJsonYaml(input, 'json-to-yaml'));
    await expect(tool.transforms![0]!.transform('{broken')).rejects.toThrow();
  });

  it('parses nested object arrays, flow collections, comments and string escapes', () => {
    const yaml = `# Order\norderId: DEMO-1042\nitems:\n  - sku: A # first item\n    qty: 2\n  - sku: B\n    qty: 1\npath: "C:\\\\tmp"\nmessage: "a\\nb"\nempty: []\nconfig: {}\nflags: [true, false, null]\n`;
    expect(parseYaml(yaml)).toEqual({
      orderId: 'DEMO-1042', items: [{ sku: 'A', qty: 2 }, { sku: 'B', qty: 1 }],
      path: 'C:\\tmp', message: 'a\nb', empty: [], config: {}, flags: [true, false, null],
    });
  });

  it('uses YAML 1.2 Core types without implicit dates or YAML 1.1 booleans', () => {
    expect(parseYaml('date: 2026-01-02\nyesValue: yes\nonValue: on\nhex: 0x10\noctal: 0o10')).toEqual({
      date: '2026-01-02', yesValue: 'yes', onValue: 'on', hex: 16, octal: 8,
    });
  });

  it('treats simple scalar keys as strings and still rejects duplicate resolved keys', () => {
    expect(parseYaml('1: value\ntrue: boolean key')).toEqual({ '1': 'value', 'true': 'boolean key' });
    expect(() => parseYaml('1: first\n"1": second')).toThrow();
  });

  it('expands bounded aliases without enabling merge-key semantics', () => {
    expect(parseYaml('base: &base {name: A}\ncopy: *base')).toEqual({ base: { name: 'A' }, copy: { name: 'A' } });
    expect(parseYaml('base: &base {name: A}\ncopy: {<<: *base}')).toEqual({ base: { name: 'A' }, copy: { '<<': { name: 'A' } } });
  });

  it('preserves dangerous-looking own keys and leaves all prototypes untouched', () => {
    const input = '{"__proto__":{"auditMarker":"test"},"constructor":{"prototype":{"auditMarker":"test"}}}';
    const parsed = parseYaml(jsonToYaml(JSON.parse(input))) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(JSON.stringify(parsed)).toBe(input);
    expect(Object.prototype).not.toHaveProperty('auditMarker');
    expect(Function.prototype).not.toHaveProperty('auditMarker');
  });

  it.each([
    'items: [1,', 'a: 1\na: 2', '---\na: 1\n---\nb: 2', '? [a, b]\n: c',
    'value: !custom text', 'value: !!timestamp 2026-01-02', 'value: !!binary aGVsbG8=',
    '%YAML 1.1\n---\na: yes', 'value: .nan', 'value: .inf', 'value: 9007199254740993',
    'a: &a [*a]', 'a: *missing',
  ])('rejects unsupported or invalid YAML %# with no partial result', (input) => {
    expect(() => convertJsonYaml(input, 'yaml-to-json')).toThrow();
  });
});

describe('structured data resource limits', () => {
  it('checks UTF-8 input size before parsing', () => {
    expect(() => parseYaml(`s: "${'é'.repeat(DATA_LIMITS.inputBytes / 2)}"`)).toThrow(/1 MiB/);
    expect(() => parseJson(' '.repeat(DATA_LIMITS.inputBytes + 1))).toThrow(/1 MiB/);
  });

  it('rejects excessive depth for JSON and YAML', () => {
    const input = '['.repeat(DATA_LIMITS.depth + 1) + '0' + ']'.repeat(DATA_LIMITS.depth + 1);
    expect(() => parseJson(input)).toThrow(/levels/);
    expect(() => parseYaml(input)).toThrow(/levels/);
  });

  it('stops very deep flow collections before AST composition and allows brackets in strings', () => {
    expect(() => parseYaml('['.repeat(100_000) + '0' + ']'.repeat(100_000))).toThrow(/64 levels/);
    const brackets = '['.repeat(1000) + ']'.repeat(1000);
    expect(parseYaml(`quoted: "${brackets}"\nplain: text ${brackets}\nblock: |\n  ${brackets}\n`)).toEqual({
      quoted: brackets, plain: `text ${brackets}`, block: `${brackets}\n`,
    });
    const boundary = '['.repeat(DATA_LIMITS.depth) + '0' + ']'.repeat(DATA_LIMITS.depth);
    expect(parseYaml(boundary)).toEqual(parseJson(boundary));
  });

  it('rejects excessive expanded values', () => {
    const input = JSON.stringify(Array.from({ length: DATA_LIMITS.nodes }, () => 0));
    expect(() => parseJson(input)).toThrow(/values/);
    expect(() => parseYaml(input)).toThrow(/values/);
  });

  it('rejects alias multiplication and excessive expanded strings before serialization', () => {
    expect(() => parseYaml(`a: &a [1]\nb: [${Array(101).fill('*a').join(', ')}]`)).toThrow(/alias/i);
    expect(() => parseYaml(`a: &a "${'x'.repeat(55_000)}"\nb: [${Array(80).fill('*a').join(', ')}]`)).toThrow(/MiB/);
    const lines = ['a: &a [0,0,0,0,0,0,0,0,0,0]'];
    let previous = 'a';
    for (const name of ['b', 'c', 'd', 'e', 'f']) {
      lines.push(`${name}: &${name} [${Array(10).fill(`*${previous}`).join(',')}]`);
      previous = name;
    }
    expect(() => parseYaml(lines.join('\n'))).toThrow();
  });

  it('does not silently coerce unsupported JS values', () => {
    for (const value of [undefined, NaN, Infinity, () => 1, new Date(), 9007199254740993n]) {
      expect(() => jsonToYaml(value)).toThrow();
    }
    const cycle: unknown[] = [];
    cycle.push(cycle);
    expect(() => normalizeJson(cycle)).toThrow(/Circular/);
  });
});
