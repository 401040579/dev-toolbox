import type { ToolDefinition } from '@/tools/types';

export function parsePrefixedInteger(input: string, prefix: '0x' | '0b' | '0o'): bigint {
  const clean = input.trim();
  const leadingMinus = clean.startsWith('-');
  const unsigned = leadingMinus ? clean.slice(1) : clean;
  const digits = unsigned.replace(new RegExp(`^${prefix}`, 'i'), '');
  // Keep accepting the UI's existing prefix + signed-value copy format.
  if (!leadingMinus && digits.startsWith('-')) {
    return -BigInt(prefix + digits.slice(1));
  }
  const magnitude = BigInt(prefix + digits);
  return leadingMinus ? -magnitude : magnitude;
}

function decToHex(input: string): string {
  const num = BigInt(input.trim());
  return num.toString(16).toUpperCase();
}

function hexToDec(input: string): string {
  return parsePrefixedInteger(input, '0x').toString(10);
}

function decToBin(input: string): string {
  const num = BigInt(input.trim());
  return num.toString(2);
}

function binToDec(input: string): string {
  return parsePrefixedInteger(input, '0b').toString(10);
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
