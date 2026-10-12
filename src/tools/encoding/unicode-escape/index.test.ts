import { describe, expect, it } from 'vitest';
import { getTransform } from '@/tools/registry';

const cases = [
  { input: '', escaped: '', all: '' },
  { input: 'Az é你好\u007f\u0080', escaped: 'Az \\u00e9\\u4f60\\u597d\u007f\\u0080', all: '\\u0041\\u007a\\u0020\\u00e9\\u4f60\\u597d\\u007f\\u0080' },
  { input: '🌍', escaped: '\\ud83c\\udf0d', all: '\\ud83c\\udf0d' },
  { input: 'A你🌍!', escaped: 'A\\u4f60\\ud83c\\udf0d!', all: '\\u0041\\u4f60\\ud83c\\udf0d\\u0021' },
  { input: '👩‍💻', escaped: '\\ud83d\\udc69\\u200d\\ud83d\\udcbb', all: '\\ud83d\\udc69\\u200d\\ud83d\\udcbb' },
  { input: '\u{10000}\u{10ffff}', escaped: '\\ud800\\udc00\\udbff\\udfff', all: '\\ud800\\udc00\\udbff\\udfff' },
  { input: '\ud800X\udfff', escaped: '\\ud800X\\udfff', all: '\\ud800\\u0058\\udfff' },
];

describe.each(['unicode-escape', 'unicode-escape-all'])('%s registered transform', (id) => {
  it.each(cases)('preserves every UTF-16 code unit in $input', async ({ input, escaped, all }) => {
    const result = await getTransform(id)!.transform(input);
    expect(result).toBe(id === 'unicode-escape-all' ? all : escaped);
    expect(await getTransform('unicode-unescape')!.transform(result)).toBe(input);
  });
});

describe('Unicode unescape compatibility', () => {
  it('keeps four-digit decoding and leaves unsupported sequences unchanged', async () => {
    const input = '\\uD83C\\uDF0D \\u4F60 \\uXYZ1 \\u12 \\U4F60 \\u{1f30d}';
    expect(await getTransform('unicode-unescape')!.transform(input))
      .toBe('🌍 你 \\uXYZ1 \\u12 \\U4F60 \\u{1f30d}');
  });
});
