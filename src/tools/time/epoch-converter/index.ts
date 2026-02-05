import type { ToolDefinition } from '@/tools/types';

// Helper to detect and convert timestamp precision
const detectAndConvertTimestamp = (num: number): number => {
  if (num > 1e18) return num / 1e6; // nanoseconds
  if (num > 1e15) return num / 1e3; // microseconds
  if (num > 1e12) return num; // milliseconds
  return num * 1000; // seconds
};

const tool: ToolDefinition = {
  id: 'epoch-converter',
  name: 'Epoch Converter',
  description: 'Convert between Unix timestamps and human-readable dates',
  category: 'time',
  keywords: ['epoch', 'timestamp', 'unix', 'date', 'time', 'convert', 'milliseconds', 'seconds', 'nanoseconds', 'ldap', 'webkit', 'batch'],
  icon: 'Clock',
  component: () => import('./EpochConverter'),
  transforms: [
    {
      id: 'epoch-to-iso',
      name: 'Epoch → ISO Date',
      description: 'Convert Unix timestamp to ISO 8601 date string (auto-detects precision)',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const num = Number(input.trim());
        if (isNaN(num)) throw new Error('Invalid number');
        const ms = detectAndConvertTimestamp(num);
        return new Date(ms).toISOString();
      },
    },
    {
      id: 'date-to-epoch',
      name: 'Date → Epoch (seconds)',
      description: 'Convert date string to Unix timestamp in seconds',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const d = new Date(input.trim());
        if (isNaN(d.getTime())) throw new Error('Invalid date');
        return String(Math.floor(d.getTime() / 1000));
      },
    },
    {
      id: 'date-to-epoch-ms',
      name: 'Date → Epoch (milliseconds)',
      description: 'Convert date string to Unix timestamp in milliseconds',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const d = new Date(input.trim());
        if (isNaN(d.getTime())) throw new Error('Invalid date');
        return String(d.getTime());
      },
    },
    {
      id: 'epoch-to-utc',
      name: 'Epoch → UTC String',
      description: 'Convert Unix timestamp to UTC date string',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const num = Number(input.trim());
        if (isNaN(num)) throw new Error('Invalid number');
        const ms = detectAndConvertTimestamp(num);
        return new Date(ms).toUTCString();
      },
    },
    {
      id: 'seconds-to-duration',
      name: 'Seconds → Duration',
      description: 'Convert seconds to human-readable duration (d h m s)',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const num = Number(input.trim());
        if (isNaN(num) || num < 0) throw new Error('Invalid number');
        const days = Math.floor(num / 86400);
        const hours = Math.floor((num % 86400) / 3600);
        const minutes = Math.floor((num % 3600) / 60);
        const seconds = Math.floor(num % 60);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      },
    },
  ],
};

export default tool;
