import { describe, expect, it } from 'vitest';
import { getTransform } from '@/tools/registry';

describe.each([
  ['dec-to-hex', 'hex-to-dec'],
  ['dec-to-bin', 'bin-to-dec'],
])('%s → %s', (encodeId, decodeId) => {
  it.each(['-1', '-255', '-9007199254740993', '0', '255', '9007199254740993'])(
    'round-trips the integer %s without losing precision', async (input) => {
      const encoded = await getTransform(encodeId)!.transform(input);
      expect(await getTransform(decodeId)!.transform(encoded)).toBe(input);
    });
});

describe('signed and existing prefixed input', () => {
  it.each([
    ['hex-to-dec', '-0xFF', '-255'],
    ['hex-to-dec', '0x-FF', '-255'],
    ['hex-to-dec', '  -0XfF  ', '-255'],
    ['hex-to-dec', '0xFF', '255'],
    ['bin-to-dec', '-0b11111111', '-255'],
    ['bin-to-dec', '0b-11111111', '-255'],
    ['bin-to-dec', '  -0B11111111  ', '-255'],
    ['bin-to-dec', '0B11111111', '255'],
  ])('%s parses %s', async (id, input, expected) => {
    expect(await getTransform(id)!.transform(input)).toBe(expected);
  });
});

describe.each([
  { id: 'hex-to-dec', inputs: ['', '0x', 'GG', '0x0xFF', '--FF', '-0x-FF', '0x-0xFF', 'FF FF'] },
  { id: 'bin-to-dec', inputs: ['', '0b', '2101', '0b0b11', '--11', '-0b-11', '0b-0b11', '11 11'] },
])('$id validation', ({ id, inputs }) => {
  it.each(inputs)('rejects malformed input %j', (input) => {
    expect(() => getTransform(id)!.transform(input)).toThrow();
  });
});
