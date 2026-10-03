import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'json-diff',
  name: 'JSON Structural Diff',
  description: 'Compare JSON values by structure and locate added, removed, or changed fields',
  category: 'json',
  keywords: ['json', 'diff', 'compare', 'structural', 'payload', 'api', 'difference'],
  icon: 'GitCompare',
  component: () => import('./JsonDiff'),
};

export default tool;
