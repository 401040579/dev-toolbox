import type { ToolDefinition } from '@/tools/types';

function base64Encode(input: string): string {
  try {
    return btoa(unescape(encodeURIComponent(input)));
  } catch {
    throw new Error('Invalid input for Base64 encoding');
  }
}

function base64Decode(input: string): string {
  try {
    return decodeURIComponent(escape(atob(input.trim())));
  } catch {
    throw new Error('Invalid Base64 string');
  }
}

const tool: ToolDefinition = {
  id: 'base64',
  name: 'Base64 Encode/Decode',
  description: 'Encode or decode Base64 strings with UTF-8 support',
  category: 'encoding',
  keywords: ['base64', 'encode', 'decode', 'btoa', 'atob'],
  icon: 'FileCode',
  component: () => import('./Base64Tool'),
  transforms: [
    {
      id: 'base64-encode',
      name: 'Base64 Encode',
      description: 'Encode text to Base64',
      inputType: 'string',
      outputType: 'string',
      transform: base64Encode,
    },
    {
      id: 'base64-decode',
      name: 'Base64 Decode',
      description: 'Decode Base64 to text',
      inputType: 'string',
      outputType: 'string',
      transform: base64Decode,
    },
  ],
};

export default tool;
