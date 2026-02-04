import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'url-encode',
  name: 'URL Encode/Decode',
  description: 'Encode or decode URL components and full URLs',
  category: 'encoding',
  keywords: ['url', 'encode', 'decode', 'percent', 'uri', 'encodeURIComponent'],
  icon: 'Link',
  component: () => import('./UrlEncode'),
  transforms: [
    {
      id: 'url-encode',
      name: 'URL Encode',
      description: 'Encode text for use in URLs',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => encodeURIComponent(input),
    },
    {
      id: 'url-decode',
      name: 'URL Decode',
      description: 'Decode URL-encoded text',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        try {
          return decodeURIComponent(input.trim());
        } catch {
          throw new Error('Invalid URL-encoded string');
        }
      },
    },
  ],
};

export default tool;
