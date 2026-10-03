import { describe, expect, it } from 'vitest';
import {
  compareJson, JSON_DIFF_LIMITS, JsonDiffError, parseJsonInput, serializeJsonDiffReport,
  type JsonDiffErrorCode,
} from './comparison';

function expectCode(run: () => unknown, code: JsonDiffErrorCode, side?: 'left' | 'right') {
  let failure: unknown;
  try { run(); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(JsonDiffError);
  expect(failure).toMatchObject({ code, side });
}
const json = JSON.stringify;

describe('JSON structural semantics', () => {
  it('ignores formatting and object key order at every level', () => {
    const report = compareJson('{"a":{"one":1,"two":2},"b":[{"x":1,"y":2}]}', ' { "b": [{"y":2,"x":1}], "a": {"two":2,"one":1} } ');
    expect(report).toEqual({ version: 1, equal: true, counts: { total: 0, added: 0, removed: 0, modified: 0 }, changes: [] });
  });

  it.each([
    ['1', '1.0'], ['1e2', '100'], ['-0', '0'],
    ['"\\u0061"', '"a"'], ['null', 'null'], ['[]', '[]'], ['{}', '{}'],
  ])('compares equivalent parsed scalar or empty values: %s and %s', (left, right) => {
    expect(compareJson(left, right).equal).toBe(true);
  });

  it.each([
    ['1', '"1"', 1, '1'], ['false', '0', false, 0], ['null', 'false', null, false],
    ['[]', '{}', [], {}], ['{}', 'null', {}, null], ['""', 'null', '', null],
  ])('keeps types distinct at the root: %s and %s', (left, right, before, after) => {
    expect(compareJson(left as string, right as string).changes).toEqual([{ kind: 'modified', path: '$', before, after }]);
  });

  it('distinguishes absent fields from present null in the serialized report', () => {
    const report = compareJson('{"removed":null,"changed":null}', '{"added":null,"changed":false}');
    expect(report.counts).toEqual({ total: 3, added: 1, removed: 1, modified: 1 });
    expect(JSON.parse(serializeJsonDiffReport(report)).changes).toEqual([
      { kind: 'added', path: '$.added', after: null },
      { kind: 'modified', path: '$.changed', before: null, after: false },
      { kind: 'removed', path: '$.removed', before: null },
    ]);
    expect(Object.prototype.hasOwnProperty.call(report.changes[0]!, 'before')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(report.changes[2]!, 'after')).toBe(false);
  });

  it('compares arrays by position and includes trailing additions or removals', () => {
    expect(compareJson('["A","B",null]', '["B","A"]').changes).toEqual([
      { kind: 'modified', path: '$[0]', before: 'A', after: 'B' },
      { kind: 'modified', path: '$[1]', before: 'B', after: 'A' },
      { kind: 'removed', path: '$[2]', before: null },
    ]);
    expect(compareJson('[1]', '[1,{}]').changes).toEqual([{ kind: 'added', path: '$[1]', after: {} }]);
    expect(compareJson('{"items":[{"qty":1}]}', '{"items":[{"qty":2}]}').changes).toEqual([
      { kind: 'modified', path: '$.items[0].qty', before: 1, after: 2 },
    ]);
  });

  it('counts an added or removed subtree once and reports type replacement once', () => {
    expect(compareJson('{}', '{"order":{"items":[{"qty":2}]}}').changes).toEqual([
      { kind: 'added', path: '$.order', after: { items: [{ qty: 2 }] } },
    ]);
    expect(compareJson('{"items":[1,2]}', '{"items":{"qty":2}}').changes).toEqual([
      { kind: 'modified', path: '$.items', before: [1, 2], after: { qty: 2 } },
    ]);
  });

  it('uses unambiguous escaped bracket paths for special, empty, and numeric object keys', () => {
    const keys = ['a.b', 'a[0]', 'quote"slash\\', '', '0', '中文', 'line\nend'];
    const right = Object.fromEntries(keys.map((key) => [key, 1]));
    const paths = compareJson('{}', json(right)).changes.map((change) => change.path);
    expect(new Set(paths)).toEqual(new Set(keys.map((key) => `$[${json(key)}]`)));
    expect(compareJson('{"0":0}', '{"0":1}').changes[0]?.path).toBe('$["0"]');
    expect(compareJson('[0]', '[1]').changes[0]?.path).toBe('$[0]');
  });

  it('treats prototype-shaped keys as own data without inheritance or pollution', () => {
    const left = '{"__proto__":{"jsonDiffMarker":1},"constructor":{"prototype":{"jsonDiffMarker":1}}}';
    const right = '{"__proto__":{"jsonDiffMarker":2},"constructor":{"prototype":{"jsonDiffMarker":3}},"toString":null}';
    const report = compareJson(left, right);
    expect(report.changes).toEqual([
      { kind: 'modified', path: '$["__proto__"].jsonDiffMarker', before: 1, after: 2 },
      { kind: 'modified', path: '$["constructor"]["prototype"].jsonDiffMarker', before: 1, after: 3 },
      { kind: 'added', path: '$.toString', after: null },
    ]);
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'jsonDiffMarker')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(Function.prototype, 'jsonDiffMarker')).toBe(false);
    expect(compareJson('{}', '{"__proto__":null}').changes[0]).toEqual({ kind: 'added', path: '$["__proto__"]', after: null });
  });

  it('follows the documented native JSON duplicate-key semantics', () => {
    expect(compareJson('{"value":1,"value":2}', '{"value":2}').equal).toBe(true);
  });
});

describe('input errors and bounded work', () => {
  it.each(['', 'undefined', '{"a":}', "{'a':1}", '[1,]', '{"a":1}\n{"b":2}'])('rejects invalid JSON %j with the affected side', (input) => {
    expectCode(() => compareJson(input, 'null'), 'invalidJson', 'left');
    expectCode(() => compareJson('null', input), 'invalidJson', 'right');
  });

  it.each(['1e400', '-1e400', '9007199254740993', '-9007199254740993', '{"nested":[1e400]}'])('rejects unsupported numeric precision/range %s', (input) => {
    expectCode(() => compareJson(input, input), 'unsupportedNumber', 'left');
  });

  it.each([
    ['0', '1e-400'],
    ['9007199254740991', '9007199254740991.1'],
    ['0.1', '0.10000000000000001'],
  ])('rejects decimals that would falsely equal %s after rounding %s', (safe, rounded) => {
    expectCode(() => compareJson(`{"value":${safe}}`, `{"value":${rounded}}`), 'unsupportedNumber', 'right');
    expectCode(() => compareJson(`{"value":${rounded}}`, `{"value":${safe}}`), 'unsupportedNumber', 'left');
  });

  it.each([
    ['1', '1.0'], ['1', '1e0'], ['1', '10e-1'],
    ['0.1', '1e-1'], ['0.1', '0.1000'], ['12.3', '1230.00e-2'],
    ['-0', '0e4000'], ['-0.000e-4000', '0'], ['0.00125', '125e-5'],
  ])('accepts equivalent decimal forms %s and %s', (left, right) => {
    expect(compareJson(left, right).equal).toBe(true);
  });

  it('skips numeric-looking strings, property names, and escaped quotes', () => {
    const input = json({ '1e-400': '9007199254740993', text: '"0.10000000000000001" and \\"1e400"', nested: ['1e-400', 0.1] });
    expect(compareJson(input, input).equal).toBe(true);
    expect(compareJson(json('0.1'), json('0.10000000000000001')).equal).toBe(false);
  });

  it('bounds enormous exponents and accepts long equivalent zero-padded notation', () => {
    expectCode(() => parseJsonInput('1e' + '9'.repeat(500_000), 'left'), 'unsupportedNumber', 'left');
    expectCode(() => parseJsonInput('1e-' + '9'.repeat(500_000), 'right'), 'unsupportedNumber', 'right');
    expect(compareJson('1e-' + '0'.repeat(500_000) + '1', '0.1').equal).toBe(true);
    expect(compareJson('0e' + '9'.repeat(500_000), '-0').equal).toBe(true);
    expect(compareJson('0.' + '0'.repeat(49_999) + '1e50000', '1').equal).toBe(true);
  });

  it('accepts safe integer edges and finite fractional values', () => {
    const value = json([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0.125, 1.25e-8]);
    expect(compareJson(value, value).equal).toBe(true);
  });

  it('checks input bytes, including multibyte characters, before parsing', () => {
    const limit = JSON_DIFF_LIMITS.inputBytes;
    expectCode(() => parseJsonInput(' '.repeat(limit + 1), 'left'), 'inputTooLarge', 'left');
    const multibyte = json('中'.repeat(Math.ceil(limit / 3)));
    expect(multibyte.length).toBeLessThan(limit);
    expectCode(() => parseJsonInput(multibyte, 'right'), 'inputTooLarge', 'right');
    expect(parseJsonInput(json('x'.repeat(limit - 2)), 'left')).toHaveLength(limit - 2);
  });

  it('bounds nesting before native parsing and ignores quoted or escaped brackets', () => {
    const nested = (depth: number) => '['.repeat(depth) + '0' + ']'.repeat(depth);
    expect(compareJson(nested(JSON_DIFF_LIMITS.depth), nested(JSON_DIFF_LIMITS.depth)).equal).toBe(true);
    expectCode(() => parseJsonInput(nested(100_000), 'right'), 'tooDeep', 'right');
    const quoted = json({ text: '['.repeat(100_000) + '\\"' + ']'.repeat(100_000) });
    expect(compareJson(quoted, quoted).equal).toBe(true);
  });

  it('counts containers and values in the node budget', () => {
    const exact = json(Array(JSON_DIFF_LIMITS.nodes - 1).fill(0));
    expect(compareJson(exact, exact).equal).toBe(true);
    expectCode(() => parseJsonInput(json(Array(JSON_DIFF_LIMITS.nodes).fill(0)), 'left'), 'tooManyNodes', 'left');
    expectCode(() => parseJsonInput(json({ rows: Array(JSON_DIFF_LIMITS.nodes - 1).fill(0) }), 'right'), 'tooManyNodes', 'right');
  });

  it('allows exactly the change limit and rejects overflow without a partial report', () => {
    const original = json(Array(JSON_DIFF_LIMITS.changes).fill(0));
    const updated = json(Array(JSON_DIFF_LIMITS.changes).fill(1));
    expect(compareJson(original, updated).counts.modified).toBe(JSON_DIFF_LIMITS.changes);
    expectCode(() => compareJson(json(Array(JSON_DIFF_LIMITS.changes + 1).fill(0)), json(Array(JSON_DIFF_LIMITS.changes + 1).fill(1))), 'tooManyChanges');
  });

  it('bounds changed path lengths while allowing unchanged long property names', () => {
    const longKey = 'x'.repeat(JSON_DIFF_LIMITS.pathCharacters + 1);
    const same = json({ [longKey]: 0 });
    expect(compareJson(same, same).equal).toBe(true);
    expectCode(() => compareJson('{}', same), 'pathTooLong');
    const exact = 'x'.repeat(JSON_DIFF_LIMITS.pathCharacters - 2);
    expect(compareJson('{}', json({ [exact]: 0 })).changes[0]?.path).toHaveLength(JSON_DIFF_LIMITS.pathCharacters);
  });

  it('caps report bytes when deep pretty-printed replacements expand small inputs', () => {
    let nested: unknown = Array(19_000).fill(0);
    for (let depth = 1; depth < JSON_DIFF_LIMITS.depth - 1; depth += 1) nested = [nested];
    const report = compareJson(json(nested), json({ wrapped: nested }));
    expect(report.counts.total).toBe(1);
    expectCode(() => serializeJsonDiffReport(report), 'reportTooLarge');
  });
});
