import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Format, minify, and validate JSON data',
  category: 'json',
  keywords: ['json', 'format', 'pretty', 'minify', 'validate', 'beautify'],
  icon: 'Braces',
  component: () => import('./JsonFormatter'),
  transforms: [
    {
      id: 'json-prettify',
      name: 'JSON Prettify',
      description: 'Format JSON with indentation',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string, options?: Record<string, unknown>) => {
        const indent = (options?.['indent'] as number) || 2;
        return JSON.stringify(JSON.parse(input), null, indent);
      },
      options: [
        {
          key: 'indent',
          label: 'Indent Size',
          type: 'select',
          default: '2',
          choices: [
            { label: '2 spaces', value: '2' },
            { label: '4 spaces', value: '4' },
            { label: 'Tab', value: '\t' },
          ],
        },
      ],
    },
    {
      id: 'json-minify',
      name: 'JSON Minify',
      description: 'Remove whitespace from JSON',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => JSON.stringify(JSON.parse(input)),
    },
  ],
};

export default tool;
