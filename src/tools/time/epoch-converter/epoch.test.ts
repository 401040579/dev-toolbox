import { expect, it } from 'vitest';
import tool from './index';

it('recognizes exact millisecond, microsecond and nanosecond precision boundaries', async () => {
  const convert = tool.transforms!.find((transform) => transform.id === 'epoch-to-iso')!.transform;
  for (const value of ['1000000000000', '1000000000000000', '1000000000000000000']) {
    expect(await convert(value)).toBe('2001-09-09T01:46:40.000Z');
  }
  expect(await convert('0')).toBe('1970-01-01T00:00:00.000Z');
});
