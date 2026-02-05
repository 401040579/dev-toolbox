import type { ToolDefinition } from '@/tools/types';

// HTML entity maps for common characters
const encodeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

function htmlEncode(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => encodeMap[char] || char);
}

function htmlEncodeAll(input: string): string {
  return Array.from(input)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code > 127 || encodeMap[char]) {
        return `&#${code};`;
      }
      return char;
    })
    .join('');
}

function htmlDecode(input: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = input;
  return textarea.value;
}

const tool: ToolDefinition = {
  id: 'html-entity',
  name: 'HTML Entity Encode/Decode',
  description: 'Encode or decode HTML entities',
  category: 'encoding',
  keywords: ['html', 'entity', 'encode', 'decode', 'escape', 'unescape', '&lt;', '&gt;', '&amp;'],
  icon: 'Code',
  component: () => import('./HtmlEntity'),
  transforms: [
    {
      id: 'html-encode',
      name: 'HTML Encode',
      description: 'Encode special characters to HTML entities',
      inputType: 'string',
      outputType: 'string',
      transform: htmlEncode,
    },
    {
      id: 'html-encode-all',
      name: 'HTML Encode All',
      description: 'Encode all non-ASCII characters to HTML entities',
      inputType: 'string',
      outputType: 'string',
      transform: htmlEncodeAll,
    },
    {
      id: 'html-decode',
      name: 'HTML Decode',
      description: 'Decode HTML entities to characters',
      inputType: 'string',
      outputType: 'string',
      transform: htmlDecode,
    },
  ],
};

export default tool;
