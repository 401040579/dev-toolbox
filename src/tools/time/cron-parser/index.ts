import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'cron-parser',
  name: 'Cron Parser',
  description: 'Parse and explain cron expressions with next run times',
  category: 'time',
  keywords: ['cron', 'schedule', 'crontab', 'job', 'timer', 'parse'],
  icon: 'Timer',
  component: () => import('./CronParser'),
};

export default tool;
