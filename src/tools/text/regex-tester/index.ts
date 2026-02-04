import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'regex-tester',
  name: 'Regex Tester',
  description: 'Test regular expressions with real-time matching and capture groups',
  category: 'text',
  keywords: ['regex', 'regexp', 'regular', 'expression', 'match', 'test', 'pattern'],
  icon: 'Regex',
  component: () => import('./RegexTester'),
};

export default tool;
