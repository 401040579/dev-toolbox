import { describe, expect, it } from 'vitest';
import { parseCron, matchesCron, nextCronRuns } from './cron';

describe('numeric five-field cron', () => {
  it.each(['60 * * * *', '* 24 * * *', '* * 0 * *', '* * * 13 *', '* * * * 8', '*/0 * * * *', '5-1 * * * *', 'abc * * * *', '* * * * * *', '*/2/3 * * * *'])('rejects invalid expression %s', (value) => {
    expect(() => parseCron(value)).toThrow();
  });
  it('handles range steps and Sunday 0/7 consistently', () => {
    expect(parseCron('1-10/3 * * * 7')[0]!.values).toEqual([1, 4, 7, 10]);
    expect(matchesCron(parseCron('0 0 * * 7'), new Date(2026, 9, 4))).toBe(true);
  });
  it('uses either restricted day field, but matches wildcard steps with the other day field', () => {
    const fields = parseCron('0 0 1 * 1');
    expect(matchesCron(fields, new Date(2026, 9, 1))).toBe(true);
    expect(matchesCron(fields, new Date(2026, 9, 5))).toBe(true);
    expect(matchesCron(fields, new Date(2026, 9, 6))).toBe(false);
    expect(matchesCron(parseCron('0 0 */2 * 1'), new Date(2026, 9, 5))).toBe(true);
    expect(matchesCron(parseCron('0 0 */2 * 1'), new Date(2026, 9, 12))).toBe(false);
  });
  it('starts after the current minute and bounds impossible dates', () => {
    const now = new Date(2026, 9, 2, 10, 5, 42);
    expect(nextCronRuns(parseCron('* * * * *'), 2, now).map((d) => d.getTime())).toEqual([new Date(2026, 9, 2, 10, 6).getTime(), new Date(2026, 9, 2, 10, 7).getTime()]);
    expect(nextCronRuns(parseCron('0 0 31 2 *'), 5, now)).toEqual([]);
  });
});
