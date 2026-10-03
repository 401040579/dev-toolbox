import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'json-yaml',
  name: 'JSON ↔ YAML',
  description: 'Convert between JSON and YAML formats',
  category: 'json',
  keywords: ['json', 'yaml', 'yml', 'convert', 'transform'],
  icon: 'ArrowLeftRight',
  component: () => import('./JsonYaml'),
  transforms: [
    {
      id: 'json-to-yaml',
      name: 'JSON → YAML',
      description: 'Convert JSON to YAML',
      inputType: 'string',
      outputType: 'string',
      transform: async (input: string) => {
        const { convertJsonYaml } = await import('./conversion');
        return convertJsonYaml(input, 'json-to-yaml');
      },
    },
  ],
};

export default tool;
