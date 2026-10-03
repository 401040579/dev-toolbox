import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'log-analyzer',
  name: 'Log Analyzer',
  description: 'Filter local logs by time, severity, request ID, and keyword',
  category: 'devtools',
  keywords: ['log', 'logs', 'jsonl', 'request', 'trace', 'error', '日志', '请求'],
  icon: 'FileSearch',
  component: () => import('./LogAnalyzer'),
};

export default tool;
