import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'epoch-converter',
  name: 'Epoch Converter',
  description: 'Convert between Unix timestamps and human-readable dates',
  category: 'time',
  keywords: ['epoch', 'timestamp', 'unix', 'date', 'time', 'convert'],
  icon: 'Clock',
  component: () => import('./EpochConverter'),
  transforms: [
    {
      id: 'epoch-to-iso',
      name: 'Epoch → ISO Date',
      description: 'Convert Unix timestamp to ISO 8601 date string',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const num = Number(input.trim());
        if (isNaN(num)) throw new Error('Invalid number');
        // Auto-detect seconds vs milliseconds
        const ms = num > 1e12 ? num : num * 1000;
        return new Date(ms).toISOString();
      },
    },
    {
      id: 'date-to-epoch',
      name: 'Date → Epoch',
      description: 'Convert date string to Unix timestamp (seconds)',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const d = new Date(input.trim());
        if (isNaN(d.getTime())) throw new Error('Invalid date');
        return String(Math.floor(d.getTime() / 1000));
      },
    },
  ],
};

export default tool;
