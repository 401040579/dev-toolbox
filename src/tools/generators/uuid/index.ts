import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'uuid-generator',
  name: 'UUID Generator',
  description: 'Generate UUIDs (v4) with various format options',
  category: 'generators',
  keywords: ['uuid', 'guid', 'generate', 'random', 'unique', 'id'],
  icon: 'Fingerprint',
  component: () => import('./UuidGenerator'),
  transforms: [
    {
      id: 'uuid-generate',
      name: 'Generate UUID',
      description: 'Generate a random UUID v4',
      inputType: 'string',
      outputType: 'string',
      transform: () => crypto.randomUUID(),
    },
  ],
};

export default tool;
