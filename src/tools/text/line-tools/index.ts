import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'line-tools',
  name: 'Line Tools',
  description: 'Sort, deduplicate, reverse, shuffle, and filter lines of text',
  category: 'text',
  keywords: ['line', 'sort', 'unique', 'deduplicate', 'reverse', 'shuffle', 'filter', 'count'],
  icon: 'ListOrdered',
  component: () => import('./LineTools'),
  transforms: [
    {
      id: 'sort-lines',
      name: 'Sort Lines',
      description: 'Sort lines alphabetically',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => input.split('\n').sort().join('\n'),
    },
    {
      id: 'unique-lines',
      name: 'Unique Lines',
      description: 'Remove duplicate lines',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => [...new Set(input.split('\n'))].join('\n'),
    },
    {
      id: 'reverse-lines',
      name: 'Reverse Lines',
      description: 'Reverse line order',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => input.split('\n').reverse().join('\n'),
    },
  ],
};

export default tool;
