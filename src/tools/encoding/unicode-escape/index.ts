import type { ToolDefinition } from '@/tools/types';

function unicodeEscape(input: string): string {
  return Array.from(input)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        return `\\u${code.toString(16).padStart(4, '0')}`;
      }
      return char;
    })
    .join('');
}

function unicodeEscapeAll(input: string): string {
  return Array.from(input)
    .map((char) => {
      const code = char.charCodeAt(0);
      return `\\u${code.toString(16).padStart(4, '0')}`;
    })
    .join('');
}

function unicodeUnescape(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

const tool: ToolDefinition = {
  id: 'unicode-escape',
  name: 'Unicode Escape/Unescape',
  description: 'Convert between Unicode escape sequences and characters',
  category: 'encoding',
  keywords: ['unicode', 'escape', 'unescape', '\\u', 'utf', 'character', 'code point'],
  icon: 'Languages',
  component: () => import('./UnicodeEscape'),
  transforms: [
    {
      id: 'unicode-escape',
      name: 'Unicode Escape',
      description: 'Escape non-ASCII characters to \\uXXXX format',
      inputType: 'string',
      outputType: 'string',
      transform: unicodeEscape,
    },
    {
      id: 'unicode-escape-all',
      name: 'Unicode Escape All',
      description: 'Escape all characters to \\uXXXX format',
      inputType: 'string',
      outputType: 'string',
      transform: unicodeEscapeAll,
    },
    {
      id: 'unicode-unescape',
      name: 'Unicode Unescape',
      description: 'Convert \\uXXXX sequences to characters',
      inputType: 'string',
      outputType: 'string',
      transform: unicodeUnescape,
    },
  ],
};

export default tool;
