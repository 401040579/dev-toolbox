import type { ToolDefinition } from '@/tools/types';

function caesarCipher(input: string, shift: number): string {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return input
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // Uppercase letters
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
      }
      // Lowercase letters
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
      }
      return char;
    })
    .join('');
}

function rot13(input: string): string {
  return caesarCipher(input, 13);
}

function rot47(input: string): string {
  return input
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(((code - 33 + 47) % 94) + 33);
      }
      return char;
    })
    .join('');
}

const tool: ToolDefinition = {
  id: 'caesar-cipher',
  name: 'Caesar Cipher / ROT13',
  description: 'Encode/decode text using Caesar cipher or ROT13',
  category: 'encoding',
  keywords: ['caesar', 'cipher', 'rot13', 'rot47', 'shift', 'encrypt', 'decode'],
  icon: 'KeyRound',
  component: () => import('./CaesarCipher'),
  transforms: [
    {
      id: 'rot13',
      name: 'ROT13',
      description: 'Apply ROT13 cipher (shift by 13)',
      inputType: 'string',
      outputType: 'string',
      transform: rot13,
    },
    {
      id: 'rot47',
      name: 'ROT47',
      description: 'Apply ROT47 cipher (ASCII 33-126)',
      inputType: 'string',
      outputType: 'string',
      transform: rot47,
    },
  ],
};

export default tool;
