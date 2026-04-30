import { describe, it, expect } from 'vitest';
import { calculateSegments, applySmartEncoding, isGsm7Compatible } from './index';

describe('calculateSegments — encoding detection', () => {
  it('chooses GSM-7 for ASCII input', () => {
    const r = calculateSegments('Hello world');
    expect(r.encoding).toBe('GSM-7');
    expect(r.isCompatibleWithGsm7).toBe(true);
  });

  it('switches to UCS-2 when emoji is present', () => {
    const r = calculateSegments('Hello 😀');
    expect(r.encoding).toBe('UCS-2');
    expect(r.isCompatibleWithGsm7).toBe(false);
    expect(r.nonGsmCharacters).toContain('😀');
  });

  it('switches to UCS-2 for Chinese text', () => {
    const r = calculateSegments('你好世界');
    expect(r.encoding).toBe('UCS-2');
  });

  it('keeps GSM-7 for accented Latin chars in the GSM-7 set', () => {
    const r = calculateSegments('Bonjour é à ñ Ω');
    expect(r.encoding).toBe('GSM-7');
  });

  it('respects forced UCS-2 encoding for ASCII', () => {
    const r = calculateSegments('hi', { encoding: 'UCS-2' });
    expect(r.encoding).toBe('UCS-2');
    expect(r.isAutoEncoding).toBe(false);
  });

  it('warns when forcing GSM-7 on incompatible text', () => {
    const r = calculateSegments('hi 😀', { encoding: 'GSM-7' });
    expect(r.encoding).toBe('GSM-7');
    expect(r.warnings).toContain('gsm7Incompatible');
  });
});

describe('calculateSegments — GSM-7 segmentation', () => {
  it('fits 160 ASCII chars in 1 segment', () => {
    const msg = 'a'.repeat(160);
    const r = calculateSegments(msg);
    expect(r.segmentsCount).toBe(1);
    expect(r.numberOfCharacters).toBe(160);
    expect(r.segmentLimit).toBe(160);
    expect(r.remainingInLastSegment).toBe(0);
  });

  it('splits 161 ASCII chars into 2 concatenated segments of 153', () => {
    const msg = 'a'.repeat(161);
    const r = calculateSegments(msg);
    expect(r.segmentsCount).toBe(2);
    expect(r.segmentLimit).toBe(153);
    expect(r.segments[0]?.charCount).toBe(153);
    expect(r.segments[1]?.charCount).toBe(8);
    expect(r.remainingInLastSegment).toBe(145);
  });

  it('counts GSM-7 extension chars as 2 code units', () => {
    const r = calculateSegments('[]{}~|^\\€');
    expect(r.encoding).toBe('GSM-7');
    expect(r.numberOfCharacters).toBe(18);
    expect(r.numberOfGraphemes).toBe(9);
  });

  it('splits exactly when extension chars push past 160 code units', () => {
    const msg = '['.repeat(81);
    const r = calculateSegments(msg);
    expect(r.encoding).toBe('GSM-7');
    expect(r.numberOfCharacters).toBe(162);
    expect(r.segmentsCount).toBe(2);
  });
});

describe('calculateSegments — UCS-2 segmentation', () => {
  it('fits 70 chars in 1 UCS-2 segment', () => {
    const msg = '世'.repeat(70);
    const r = calculateSegments(msg);
    expect(r.encoding).toBe('UCS-2');
    expect(r.segmentsCount).toBe(1);
    expect(r.numberOfCharacters).toBe(70);
  });

  it('splits 71 UCS-2 chars into 2 concatenated segments of 67', () => {
    const msg = '世'.repeat(71);
    const r = calculateSegments(msg);
    expect(r.segmentsCount).toBe(2);
    expect(r.segmentLimit).toBe(67);
    expect(r.segments[0]?.charCount).toBe(67);
    expect(r.segments[1]?.charCount).toBe(4);
  });

  it('treats a multi-codepoint emoji as 1 grapheme but 2+ code units', () => {
    const r = calculateSegments('😀'.repeat(35));
    expect(r.encoding).toBe('UCS-2');
    expect(r.numberOfCharacters).toBe(35);
    expect(r.numberOfUnicodeScalars).toBe(35);
    expect(r.utf8Bytes).toBe(140);
  });
});

describe('UTF-8 byte counting', () => {
  it('counts ASCII as 1 byte each', () => {
    expect(calculateSegments('hello').utf8Bytes).toBe(5);
  });

  it('counts CJK as 3 bytes each', () => {
    expect(calculateSegments('你好').utf8Bytes).toBe(6);
  });

  it('counts emoji as 4 bytes each', () => {
    expect(calculateSegments('😀😀').utf8Bytes).toBe(8);
  });
});

describe('Smart Encoding', () => {
  it('replaces curly quotes with straight quotes', () => {
    expect(applySmartEncoding('“Hi”')).toBe('"Hi"');
    expect(applySmartEncoding('it’s')).toBe("it's");
  });

  it('replaces em/en dashes with hyphen', () => {
    expect(applySmartEncoding('a—b–c')).toBe('a-b-c');
  });

  it('replaces ellipsis with three dots', () => {
    expect(applySmartEncoding('hi…')).toBe('hi...');
  });

  it('keeps original message when no replacements apply', () => {
    expect(applySmartEncoding('hello')).toBe('hello');
  });

  it('promotes message back to GSM-7 after smart encoding', () => {
    const before = calculateSegments('“hi”');
    expect(before.encoding).toBe('UCS-2');

    const after = calculateSegments('“hi”', { smartEncoding: true });
    expect(after.encoding).toBe('GSM-7');
    expect(after.smartEncodingApplied).toBe(true);
    expect(after.smartEncodedMessage).toBe('"hi"');
  });
});

describe('isGsm7Compatible helper', () => {
  it('returns true for plain ASCII', () => {
    expect(isGsm7Compatible('Hello there')).toBe(true);
  });
  it('returns false for emoji', () => {
    expect(isGsm7Compatible('hi 😀')).toBe(false);
  });
  it('returns false for CJK', () => {
    expect(isGsm7Compatible('hello 中')).toBe(false);
  });
});
