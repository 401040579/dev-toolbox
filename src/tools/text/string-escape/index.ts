import type { ToolDefinition } from '@/tools/types';

export type EscapeFormat = 'json' | 'javascript' | 'html' | 'url' | 'sql' | 'csv';

export function escapeString(input: string, format: EscapeFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(input).slice(1, -1);
    case 'javascript':
      return input
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/\b/g, '\\b');
    case 'html':
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    case 'url':
      return encodeURIComponent(input);
    case 'sql':
      return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
    case 'csv':
      if (input.includes(',') || input.includes('"') || input.includes('\n')) {
        return '"' + input.replace(/"/g, '""') + '"';
      }
      return input;
    default:
      return input;
  }
}

export function unescapeString(input: string, format: EscapeFormat): string {
  switch (format) {
    case 'json':
      try {
        return JSON.parse(`"${input}"`);
      } catch {
        return input;
      }
    case 'javascript':
      return input
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\f/g, '\f')
        .replace(/\\b/g, '\b')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
    case 'html':
      return input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    case 'url':
      try {
        return decodeURIComponent(input);
      } catch {
        return input;
      }
    case 'sql':
      return input.replace(/''/g, "'").replace(/\\\\/g, '\\');
    case 'csv':
      if (input.startsWith('"') && input.endsWith('"')) {
        return input.slice(1, -1).replace(/""/g, '"');
      }
      return input;
    default:
      return input;
  }
}

const tool: ToolDefinition = {
  id: 'string-escape',
  name: 'String Escape/Unescape',
  description: 'Escape and unescape strings for JSON, JavaScript, HTML, URL, SQL',
  category: 'text',
  keywords: ['escape', 'unescape', 'string', 'json', 'javascript', 'html', 'url', 'sql'],
  icon: 'Code',
  component: () => import('./StringEscape'),
  transforms: [
    {
      id: 'escape-json',
      name: 'Escape JSON',
      description: 'Escape string for JSON',
      inputType: 'string',
      outputType: 'string',
      transform: (s) => escapeString(s, 'json'),
    },
    {
      id: 'unescape-json',
      name: 'Unescape JSON',
      description: 'Unescape JSON string',
      inputType: 'string',
      outputType: 'string',
      transform: (s) => unescapeString(s, 'json'),
    },
  ],
};

export default tool;
