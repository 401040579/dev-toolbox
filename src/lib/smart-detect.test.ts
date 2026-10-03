import { describe, expect, it } from 'vitest';
import { detectSmartPaste } from './smart-detect';
import { MAX_TOOL_INPUT_BYTES } from './tool-handoff';

const encodePart = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = `${encodePart({ alg: 'HS256', typ: 'JWT' })}.${encodePart({ sub: '123', exp: 2000000000 })}.AQID`;

describe('smart paste suggestions', () => {
  it('ignores empty or whitespace-only input', () => {
    expect(detectSmartPaste(' \n\t')).toEqual({ candidates: [] });
  });

  it.each([
    [' {"user":{"name":"张三"},"values":[1,true]} ', 'jsonObject'],
    ['[1,{"ok":true},null]', 'jsonArray'],
  ])('recommends structural JSON while preserving the original input', (input, reason) => {
    const result = detectSmartPaste(input);
    expect(result.candidates[0]).toEqual({ kind: 'json', toolId: 'json-formatter', reason, fields: { input } });
    expect(result.candidates[result.candidates.length - 1]?.toolId).toBe('text-stats');
  });

  it.each(['null', 'true', '123', '"hello"', '{"bad":}', '[1,', 'plain text'])('does not mislabel invalid or primitive JSON: %s', (input) => {
    expect(detectSmartPaste(input).candidates.map((candidate) => candidate.kind)).toEqual(['text']);
  });

  it('recognizes a JWT structure without trusting its signature and accepts explicit unsigned JWTs', () => {
    expect(detectSmartPaste(` ${jwt} `).candidates[0]).toMatchObject({ kind: 'jwt', toolId: 'jwt-decode', fields: { input: jwt } });
    const unsigned = `${encodePart({ alg: 'none' })}.${encodePart({ sub: '123' })}.`;
    expect(detectSmartPaste(unsigned).candidates[0]?.kind).toBe('jwt');
  });

  it.each([
    'aaa.bbb.ccc',
    `${encodePart([])}.${encodePart({ sub: '123' })}.AQID`,
    `${encodePart({ alg: 'HS256' })}.${encodePart(null)}.AQID`,
    `${encodePart({ typ: 'JWT' })}.${encodePart({ sub: '123' })}.AQID`,
    `${encodePart({ alg: 'HS256' })}.${encodePart({ sub: '123' })}.`,
    `${encodePart({ alg: 'none' })}.${encodePart({ sub: '123' })}.AQID`,
    `${encodePart({ alg: 'HS256' })}.${encodePart({ sub: '123' })}.A`,
    `${encodePart({ alg: 'HS256' })}.${encodePart({ sub: '123' })}.AB`,
    jwt + '.extra',
  ])('does not recommend damaged or non-JWT tokens: %s', (input) => {
    expect(detectSmartPaste(input).candidates.map((candidate) => candidate.kind)).toEqual(['text']);
  });

  it.each([
    ['1735689600', 'seconds'], ['1735689600000', 'milliseconds'], ['1000000000000', 'milliseconds'], ['946684800', 'seconds'], ['-1234567890', 'seconds'],
  ])('offers conservative timestamps with a plain text alternative: %s', (input, reason) => {
    expect(detectSmartPaste(input).candidates).toEqual([
      { kind: 'timestamp', toolId: 'epoch-converter', reason, fields: { input, mode: 'epoch-to-date', activeTab: 'converter' } },
      { kind: 'text', toolId: 'text-stats', reason: 'text', fields: { input } },
    ]);
  });

  it.each(['123', '0', '12345678', '1735689600.5', '1e9', '0017356896', '17356896000000', '-1735689600000'])('does not guess a small, fractional or unsupported integer as a timestamp: %s', (input) => {
    expect(detectSmartPaste(input).candidates.map((candidate) => candidate.kind)).toEqual(['text']);
  });

  it.each(['https://example.com/a?x=1#part', 'http://localhost:8080/path', 'https://例子.测试/你好'])('recommends HTTP URLs without following them: %s', (input) => {
    expect(detectSmartPaste(input).candidates[0]).toMatchObject({ kind: 'url', toolId: 'url-parser', fields: { input } });
  });

  it.each(['javascript:alert(1)', 'file:///tmp/test', 'ftp://example.com', 'https://', 'https://example.com bad', 'example.com'])('does not turn invalid or unsupported schemes into a URL suggestion: %s', (input) => {
    expect(detectSmartPaste(input).candidates.map((candidate) => candidate.kind)).toEqual(['text']);
  });

  it.each(['aGVsbG8gd29ybGQ=', '5L2g5aW9', 'aGVs\nbG8='])('offers a Base64 decode action only for canonical UTF-8 text: %s', (input) => {
    expect(detectSmartPaste(input).candidates[0]).toEqual({ kind: 'base64', toolId: 'base64', reason: 'base64', fields: { input, mode: 'decode' } });
    const candidates = detectSmartPaste(input).candidates;
    expect(candidates[candidates.length - 1]?.kind).toBe('text');
  });

  it.each(['hello', 'test', 'aGk=', 'aGVsbG8', 'aGVsbG9=', 'aGVsbG8===', '////////', 'AAAAAA==', 'YWJj-ZGVm'])('avoids ambiguous short, binary or noncanonical Base64: %s', (input) => {
    expect(detectSmartPaste(input).candidates.map((candidate) => candidate.kind)).toEqual(['text']);
  });

  it('rejects oversized pasted text before parsing and accounts for UTF-8 bytes', () => {
    expect(detectSmartPaste('{"x":"' + 'x'.repeat(MAX_TOOL_INPUT_BYTES) + '"}')).toEqual({ candidates: [], error: 'tooLarge' });
    expect(detectSmartPaste('中'.repeat(Math.ceil(MAX_TOOL_INPUT_BYTES / 3)))).toEqual({ candidates: [], error: 'tooLarge' });
  });
});
