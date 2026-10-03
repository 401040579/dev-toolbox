export const CRON_FIELD_KEYS = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;
const BOUNDS = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]] as const;

export interface CronField { source: string; values: number[]; wildcard: boolean }

// Numeric five-field crontab syntax; unsupported extensions are rejected explicitly.
export function parseCron(expression: string): CronField[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5 || expression.length > 500) throw new Error('Expected five numeric cron fields');
  return parts.map((source, index) => {
    const [min, max] = BOUNDS[index]!;
    const values = new Set<number>();
    for (const item of source.split(',')) {
      const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(item);
      if (!match) throw new Error('Invalid cron field');
      const base = match[1]!;
      const step = match[2] === undefined ? 1 : Number(match[2]);
      if (!Number.isSafeInteger(step) || step < 1 || step > max - min + 1) throw new Error('Invalid cron step');
      let start: number = min, end: number = max;
      if (base !== '*') {
        const range = base.split('-').map(Number);
        start = range[0]!;
        end = range[1] ?? (match[2] ? max : start);
      }
      if (start < min || end > max || start > end) throw new Error('Cron value outside field range');
      for (let value = start; value <= end; value += step) values.add(index === 4 && value === 7 ? 0 : value);
    }
    return { source, values: [...values].sort((a, b) => a - b), wildcard: source.startsWith('*') };
  });
}

export function matchesCron(fields: CronField[], date: Date): boolean {
  const [minute, hour, dom, month, dow] = fields;
  if (!minute || !hour || !dom || !month || !dow) return false;
  const dayMatch = dom.wildcard || dow.wildcard
    ? dom.values.includes(date.getDate()) && dow.values.includes(date.getDay())
    : dom.values.includes(date.getDate()) || dow.values.includes(date.getDay());
  return minute.values.includes(date.getMinutes()) && hour.values.includes(date.getHours()) && month.values.includes(date.getMonth() + 1) && dayMatch;
}

export function nextCronRuns(fields: CronField[], count = 5, now = new Date()): Date[] {
  const runs: Date[] = [];
  // Advance epoch minutes so local DST repeats/skips reflect the actual browser clock.
  let timestamp = Math.floor(now.getTime() / 60_000) * 60_000 + 60_000;
  for (let i = 0; i < 366 * 24 * 60 && runs.length < count; i++, timestamp += 60_000) {
    const candidate = new Date(timestamp);
    if (matchesCron(fields, candidate)) runs.push(candidate);
  }
  return runs;
}
