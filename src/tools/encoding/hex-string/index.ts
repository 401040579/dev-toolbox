import type { ToolDefinition } from '@/tools/types';

function stringToHex(input: string, separator: string = ' '): string {
  return Array.from(new TextEncoder().encode(input))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(separator);
}

function hexToString(input: string): string {
  const hex = input.replace(/[^0-9a-fA-F]/g, '');
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

const tool: ToolDefinition = {
  id: 'hex-string',
  name: 'Hex ↔ String',
  description: 'Convert between hexadecimal and text strings',
  category: 'encoding',
  keywords: ['hex', 'hexadecimal', 'string', 'text', 'convert', 'bytes'],
  icon: 'Binary',
  component: () => import('./HexString'),
  transforms: [
    {
      id: 'string-to-hex',
      name: 'String → Hex',
      description: 'Convert text to hexadecimal',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => stringToHex(input, ' '),
    },
    {
      id: 'hex-to-string',
      name: 'Hex → String',
      description: 'Convert hexadecimal to text',
      inputType: 'string',
      outputType: 'string',
      transform: hexToString,
    },
  ],
};

export default tool;
