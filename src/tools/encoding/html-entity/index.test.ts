// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getTransform } from '@/tools/registry';

const cases = [
  { input: '', encoded: '', all: '' },
  { input: 'ASCII 127\u007f', encoded: 'ASCII 127\u007f', all: 'ASCII 127\u007f' },
  { input: '你好 é', encoded: '你好 é', all: '&#20320;&#22909; &#233;' },
  { input: '&<>"\'`=/', encoded: '&amp;&lt;&gt;&quot;&#39;&#x60;&#x3D;&#x2F;', all: '&#38;&#60;&#62;&#34;&#39;&#96;&#61;&#47;' },
  { input: '🌍', encoded: '🌍', all: '&#127757;' },
  { input: '<🌍 & 👩‍💻>', encoded: '&lt;🌍 &amp; 👩‍💻&gt;', all: '&#60;&#127757; &#38; &#128105;&#8205;&#128187;&#62;' },
  { input: '𝄞', encoded: '𝄞', all: '&#119070;' },
  { input: '\u{10000}\u{10ffff}', encoded: '\u{10000}\u{10ffff}', all: '&#65536;&#1114111;' },
];

describe.each(['html-encode', 'html-encode-all'])('%s registered transform', (id) => {
  it.each(cases)('encodes and round-trips $input', async ({ input, encoded, all }) => {
    const result = await getTransform(id)!.transform(input);
    expect(result).toBe(id === 'html-encode-all' ? all : encoded);
    expect(await getTransform('html-decode')!.transform(result)).toBe(input);
  });
});

describe('HTML decoder compatibility', () => {
  it.each([
    ['&amp;lt; &lt; &bogus; &#x1F30D;', '&lt; < &bogus; 🌍'],
    ['&#127757;&#128105;&#8205;&#128187;', '🌍👩‍💻'],
    ['&#55356; &#0; &#128;', '� � €'],
  ])('retains browser decoding for %s', async (input, expected) => {
    expect(await getTransform('html-decode')!.transform(input)).toBe(expected);
  });
});
