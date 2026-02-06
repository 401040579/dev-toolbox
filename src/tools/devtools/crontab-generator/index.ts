import type { ToolDefinition } from '@/tools/types';

export interface CrontabPart {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export const PRESETS: { label: string; expression: string }[] = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every 15 minutes', expression: '*/15 * * * *' },
  { label: 'Every 30 minutes', expression: '*/30 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Every 6 hours', expression: '0 */6 * * *' },
  { label: 'Every day at midnight', expression: '0 0 * * *' },
  { label: 'Every day at noon', expression: '0 12 * * *' },
  { label: 'Every Monday at 9am', expression: '0 9 * * 1' },
  { label: 'Every weekday at 9am', expression: '0 9 * * 1-5' },
  { label: 'First of every month', expression: '0 0 1 * *' },
  { label: 'Every Sunday at 2am', expression: '0 2 * * 0' },
];

export function parseCrontab(expression: string): CrontabPart | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0]!,
    hour: parts[1]!,
    dayOfMonth: parts[2]!,
    month: parts[3]!,
    dayOfWeek: parts[4]!,
  };
}

export function buildCrontab(parts: CrontabPart): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
}

export function describeCrontab(expression: string): string {
  const parts = parseCrontab(expression);
  if (!parts) return 'Invalid expression';

  const desc: string[] = [];

  // Minute
  if (parts.minute === '*') desc.push('every minute');
  else if (parts.minute.startsWith('*/')) desc.push(`every ${parts.minute.slice(2)} minutes`);
  else desc.push(`at minute ${parts.minute}`);

  // Hour
  if (parts.hour === '*') { /* every hour already implied */ }
  else if (parts.hour.startsWith('*/')) desc.push(`every ${parts.hour.slice(2)} hours`);
  else desc.push(`at hour ${parts.hour}`);

  // Day of month
  if (parts.dayOfMonth !== '*') desc.push(`on day ${parts.dayOfMonth} of the month`);

  // Month
  if (parts.month !== '*') desc.push(`in month ${parts.month}`);

  // Day of week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (parts.dayOfWeek !== '*') {
    if (parts.dayOfWeek === '1-5') desc.push('on weekdays');
    else if (parts.dayOfWeek === '0,6') desc.push('on weekends');
    else {
      const dayNum = parseInt(parts.dayOfWeek);
      if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) desc.push(`on ${days[dayNum]}`);
      else desc.push(`on day of week ${parts.dayOfWeek}`);
    }
  }

  return desc.join(', ');
}

const tool: ToolDefinition = {
  id: 'crontab-generator',
  name: 'Crontab Generator',
  description: 'Build and visualize cron expressions',
  category: 'devtools',
  keywords: ['cron', 'crontab', 'schedule', 'generate', 'expression'],
  icon: 'Clock',
  component: () => import('./CrontabGenerator'),
};

export default tool;
