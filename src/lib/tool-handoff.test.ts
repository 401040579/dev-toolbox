import { afterEach, describe, expect, it, vi } from 'vitest';
import { consumeToolInput, isToolInputWithinLimit, MAX_TOOL_INPUT_BYTES, peekToolInput, queueToolInput } from './tool-handoff';

afterEach(() => {
  vi.useRealTimers();
  for (const id of ['json-formatter', 'jwt-decode', 'epoch-converter', 'url-parser', 'base64', 'text-stats']) consumeToolInput(id);
});

describe('single-use tool input handoff', () => {
  it('delivers only to the requested tool, exactly once, without mutating the source', () => {
    const fields = { input: 'hello', mode: 'decode' };
    queueToolInput('base64', fields);
    fields.input = 'changed';
    expect(consumeToolInput('json-formatter')).toBeUndefined();
    expect(consumeToolInput('base64')).toEqual({ input: 'hello', mode: 'decode' });
    expect(consumeToolInput('base64')).toBeUndefined();
  });

  it('allows repeated read-only peeks for StrictMode without consuming or changing the record', () => {
    queueToolInput('json-formatter', { input: '{"ok":true}' });
    const first = peekToolInput('json-formatter')!;
    first.input = 'changed';
    expect(peekToolInput('json-formatter')).toEqual({ input: '{"ok":true}' });
    expect(peekToolInput('url-parser')).toBeUndefined();
    expect(consumeToolInput('json-formatter')).toEqual({ input: '{"ok":true}' });
    expect(peekToolInput('json-formatter')).toBeUndefined();
  });

  it('keeps only the latest selection and expires an undelivered selection', () => {
    vi.useFakeTimers();
    queueToolInput('base64', { input: 'aGVsbG8=', mode: 'decode' });
    queueToolInput('text-stats', { input: 'new' });
    expect(consumeToolInput('base64')).toBeUndefined();
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(peekToolInput('text-stats')).toBeUndefined();
    expect(consumeToolInput('text-stats')).toBeUndefined();
  });

  it.each([
    ['missing-tool', { input: 'test' }],
    ['__proto__', { input: 'test' }],
    ['json-formatter', { input: 'test', mode: 'decode' }],
    ['base64', { input: 'test', mode: 'encode' }],
    ['epoch-converter', { input: '1735689600', activeTab: 'special' }],
    ['base64', { input: 'test', secret: 'do not persist' }],
    ['text-stats', { input: 123 }],
    ['text-stats', { input: { value: 'test' } }],
    ['text-stats', {}],
  ])('rejects unapproved tool/field/value combinations: %s', (tool, fields) => {
    expect(() => queueToolInput(tool, fields)).toThrow();
  });

  it('rejects symbol fields and does not allow prototype pollution fields', () => {
    expect(() => queueToolInput('text-stats', { input: 'test', [Symbol('secret')]: 'value' })).toThrow();
    expect(() => queueToolInput('text-stats', JSON.parse('{"input":"test","__proto__":{"polluted":true}}'))).toThrow();
    expect({}).not.toHaveProperty('polluted');
  });

  it('uses the UTF-8 byte limit, including multibyte input, and accepts the boundary', () => {
    expect(isToolInputWithinLimit('x'.repeat(MAX_TOOL_INPUT_BYTES))).toBe(true);
    queueToolInput('text-stats', { input: 'x'.repeat(MAX_TOOL_INPUT_BYTES) });
    expect(consumeToolInput('text-stats')?.input).toHaveLength(MAX_TOOL_INPUT_BYTES);
    expect(() => queueToolInput('text-stats', { input: 'x'.repeat(MAX_TOOL_INPUT_BYTES + 1) })).toThrow();
    expect(() => queueToolInput('text-stats', { input: '中'.repeat(Math.ceil(MAX_TOOL_INPUT_BYTES / 3)) })).toThrow();
  });
});
