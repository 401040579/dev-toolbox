import type { ToolDefinition } from '@/tools/types';

function charToAscii(input: string): string {
  return Array.from(input)
    .map((char) => char.charCodeAt(0))
    .join(' ');
}

function asciiToChar(input: string): string {
  const codes = input.trim().split(/[\s,]+/).filter(Boolean);
  return codes.map((code) => String.fromCharCode(parseInt(code, 10))).join('');
}

function charToHex(input: string): string {
  return Array.from(input)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}

function charToBin(input: string): string {
  return Array.from(input)
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

const tool: ToolDefinition = {
  id: 'ascii-table',
  name: 'ASCII / Character Converter',
  description: 'Convert between characters and ASCII codes, hex, or binary',
  category: 'encoding',
  keywords: ['ascii', 'character', 'code', 'convert', 'chr', 'ord', 'charcode'],
  icon: 'Table',
  component: () => import('./AsciiTable'),
  transforms: [
    {
      id: 'char-to-ascii',
      name: 'Char → ASCII',
      description: 'Convert characters to ASCII codes',
      inputType: 'string',
      outputType: 'string',
      transform: charToAscii,
    },
    {
      id: 'ascii-to-char',
      name: 'ASCII → Char',
      description: 'Convert ASCII codes to characters',
      inputType: 'string',
      outputType: 'string',
      transform: asciiToChar,
    },
    {
      id: 'char-to-hex',
      name: 'Char → Hex',
      description: 'Convert characters to hex codes',
      inputType: 'string',
      outputType: 'string',
      transform: charToHex,
    },
    {
      id: 'char-to-bin',
      name: 'Char → Binary',
      description: 'Convert characters to binary',
      inputType: 'string',
      outputType: 'string',
      transform: charToBin,
    },
  ],
};

export default tool;
