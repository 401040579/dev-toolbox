import type { ToolDefinition } from '@/tools/types';

function decToHex(input: string): string {
  const num = BigInt(input.trim());
  return num.toString(16).toUpperCase();
}

function hexToDec(input: string): string {
  const clean = input.trim().replace(/^0x/i, '');
  return BigInt('0x' + clean).toString(10);
}

function decToBin(input: string): string {
  const num = BigInt(input.trim());
  return num.toString(2);
}

function binToDec(input: string): string {
  const clean = input.trim().replace(/^0b/i, '');
  return BigInt('0b' + clean).toString(10);
}

const tool: ToolDefinition = {
  id: 'number-base',
  name: 'Number Base Converter',
  description: 'Convert numbers between decimal, hexadecimal, binary, and octal',
  category: 'encoding',
  keywords: ['number', 'base', 'hex', 'decimal', 'binary', 'octal', 'convert', 'radix'],
  icon: 'Calculator',
  component: () => import('./NumberBase'),
  transforms: [
    {
      id: 'dec-to-hex',
      name: 'Decimal → Hex',
      description: 'Convert decimal to hexadecimal',
      inputType: 'string',
      outputType: 'string',
      transform: decToHex,
    },
    {
      id: 'hex-to-dec',
      name: 'Hex → Decimal',
      description: 'Convert hexadecimal to decimal',
      inputType: 'string',
      outputType: 'string',
      transform: hexToDec,
    },
    {
      id: 'dec-to-bin',
      name: 'Decimal → Binary',
      description: 'Convert decimal to binary',
      inputType: 'string',
      outputType: 'string',
      transform: decToBin,
    },
    {
      id: 'bin-to-dec',
      name: 'Binary → Decimal',
      description: 'Convert binary to decimal',
      inputType: 'string',
      outputType: 'string',
      transform: binToDec,
    },
  ],
};

export default tool;
