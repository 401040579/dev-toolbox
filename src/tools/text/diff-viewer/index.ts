import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'diff-viewer',
  name: 'Diff Viewer',
  description: 'Compare two texts and see differences side by side',
  category: 'text',
  keywords: ['diff', 'compare', 'difference', 'merge', 'text'],
  icon: 'GitCompareArrows',
  component: () => import('./DiffViewer'),
};

export default tool;
