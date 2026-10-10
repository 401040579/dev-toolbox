import { describe, expect, it } from 'vitest';
import tool, { truncateMiddle, truncateText } from './index';

describe('short truncation budgets', () => {
  it.each([
    [0, ''], [1, '.'], [2, '..'], [3, '...'], [4, 'a...'], [5, 'ab...'],
  ])('end truncation fits limit %i', (length, expected) => {
    expect(truncateText('abcdefghij', { length: length as number })).toBe(expected);
  });

  it.each([
    [0, ''], [1, '.'], [2, '..'], [3, '...'], [4, 'a...'], [5, 'a...j'], [6, 'ab...j'],
  ])('middle truncation fits limit %i', (length, expected) => {
    expect(truncateMiddle('abcdefghij', length as number)).toBe(expected);
  });

  it.each(['end', 'middle'])('%s truncation clips an oversized custom marker', (mode) => {
    const result = mode === 'end'
      ? truncateText('abcdefghij', { length: 2, ending: '[cut]' })
      : truncateMiddle('abcdefghij', 2, '[cut]');
    expect(result).toBe('[c');
  });

  it('does not restore the whole input when an empty separator leaves no suffix budget', () => {
    expect(truncateMiddle('abcdef', 0, '')).toBe('');
    expect(truncateMiddle('abcdef', 1, '')).toBe('a');
    expect(truncateMiddle('abcdef', 2, '')).toBe('af');
    expect(truncateMiddle('abcdef', 3, '')).toBe('abf');
    expect(truncateText('abcdef', { length: 1, ending: '' })).toBe('a');
  });

  it('never expands long input across short ASCII budgets and marker lengths', () => {
    const input = 'abcdefghijklmnopqrstuvwxyz';
    for (const marker of ['', '.', '...', '[omitted]']) {
      for (let length = 0; length <= 12; length++) {
        expect(truncateText(input, { length, ending: marker }).length).toBeLessThanOrEqual(length);
        expect(truncateMiddle(input, length, marker).length).toBeLessThanOrEqual(length);
      }
    }
  });
});

describe('UTF-16 budget compatibility', () => {
  it.each(['end', 'middle'])('%s truncation clips a Unicode marker without tearing a surrogate pair', (mode) => {
    const truncate = (length: number, marker: string) => mode === 'end'
      ? truncateText('abcdefghij', { length, ending: marker })
      : truncateMiddle('abcdefghij', length, marker);
    expect(truncate(1, '😀')).toBe('');
    expect(truncate(2, 'A😀B')).toBe('A');
    expect(truncate(3, 'A😀B')).toBe('A😀');
  });

  it('keeps a complete input surrogate pair at an end cutoff', () => {
    expect(truncateText('A😀BCDEF', { length: 5, preserveWords: false })).toBe('A...');
    expect(truncateText('😀abcdef', { length: 4, preserveWords: false })).toBe('...');
    expect(truncateText('😀abcdef', { length: 5, preserveWords: false })).toBe('😀...');
  });

  it('keeps complete surrogate pairs at both middle cutoffs', () => {
    expect(truncateMiddle('😀abcdef😀', 5)).toBe('...');
    expect(truncateMiddle('😀abcdef😀', 6)).toBe('😀...');
    expect(truncateMiddle('😀abcdef😀', 7)).toBe('😀...😀');
    expect(truncateMiddle('x😀abcdef😀y', 6)).toBe('x...y');
  });

  it('retains UTF-16 length counting, BMP text and combining-mark behavior', () => {
    expect(truncateText('😀', { length: 2 })).toBe('😀');
    expect(truncateMiddle('😀', 2)).toBe('😀');
    expect(truncateText('你好世界', { length: 3, ending: '…', preserveWords: false })).toBe('你好…');
    expect(truncateMiddle('你好世界', 3, '…')).toBe('你…界');
    expect(truncateText('e\u0301clair', { length: 4, preserveWords: false })).toBe('e...');
  });
});

describe('existing truncation behavior', () => {
  it('leaves input within the limit unchanged, even with an oversized marker', () => {
    expect(truncateText('abc', { length: 3, ending: '[omitted]' })).toBe('abc');
    expect(truncateMiddle('abc', 3, '[omitted]')).toBe('abc');
    expect(truncateText('')).toBe('');
    expect(truncateMiddle('', 0)).toBe('');
  });

  it('preserves word and trailing-punctuation handling', () => {
    expect(truncateText('hello world again', { length: 12 })).toBe('hello...');
    expect(truncateText('hello world again', { length: 12, preserveWords: false })).toBe('hello wor...');
    expect(truncateText('hello, world again', { length: 9, preserveWords: false })).toBe('hello...');
    expect(truncateMiddle('abcdefghij', 8)).toBe('abc...ij');
  });

  it('keeps the registered Pipeline transform at its existing 100-unit limit', () => {
    const transform = tool.transforms!.find((entry) => entry.id === 'truncate-100')!.transform;
    expect(transform('x'.repeat(101))).toBe('x'.repeat(97) + '...');
    expect(transform('x'.repeat(100))).toBe('x'.repeat(100));
  });
});
