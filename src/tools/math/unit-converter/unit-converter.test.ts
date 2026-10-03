import { expect, it } from 'vitest';
import { convert, formatConvertedNumber } from './index';

it.each([0, 1e9, -1e9, 1e20, -1e20, 1e-20, Number.MAX_VALUE, -Number.MAX_VALUE])('preserves the magnitude of %s in displayed conversions', (value) => {
  expect(Number(formatConvertedNumber(convert(value, 'm', 'm', 'length')))).toBe(value);
});
it('rounds floating point noise without corrupting integer or exponent zeros', () => {
  expect(formatConvertedNumber(0.1 + 0.2)).toBe('0.3');
  expect(formatConvertedNumber(1000)).toBe('1000');
  expect(formatConvertedNumber(1e30)).toBe('1e+30');
  expect(formatConvertedNumber(Infinity)).toBe('');
  expect(formatConvertedNumber(NaN)).toBe('');
});
