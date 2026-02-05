import type { ToolDefinition } from '@/tools/types';

export interface FormatOptions {
  indent: string;
}

export function formatXML(xml: string, options: Partial<FormatOptions> = {}): string {
  const { indent = '  ' } = options;

  if (!xml.trim()) return '';

  // Tokenize XML
  const tokens = tokenize(xml);
  let result = '';
  let depth = 0;
  let prevWasText = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const nextToken = tokens[i + 1] || '';

    // Handle XML declaration
    if (token.startsWith('<?')) {
      result += token + '\n';
      continue;
    }

    // Handle DOCTYPE
    if (token.toUpperCase().startsWith('<!DOCTYPE')) {
      result += token + '\n';
      continue;
    }

    // Handle comments
    if (token.startsWith('<!--')) {
      result += indent.repeat(depth) + token + '\n';
      continue;
    }

    // Handle CDATA
    if (token.startsWith('<![CDATA[')) {
      result += token;
      continue;
    }

    // Handle closing tags
    if (token.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      if (prevWasText) {
        result += token;
      } else {
        result = result.trimEnd() + '\n' + indent.repeat(depth) + token;
      }
      result += '\n';
      prevWasText = false;
      continue;
    }

    // Handle self-closing tags
    if (token.endsWith('/>')) {
      result += indent.repeat(depth) + token + '\n';
      prevWasText = false;
      continue;
    }

    // Handle opening tags
    if (token.startsWith('<')) {
      result += indent.repeat(depth) + token;
      // Check if next token is text content (not a tag)
      if (nextToken && !nextToken.startsWith('<')) {
        // Don't add newline, text follows
      } else {
        result += '\n';
      }
      depth++;
      prevWasText = false;
      continue;
    }

    // Handle text content
    const trimmedText = token.trim();
    if (trimmedText) {
      result += trimmedText;
      prevWasText = true;
    }
  }

  return result.trim();
}

function tokenize(xml: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let i = 0;

  while (i < xml.length) {
    const char = xml[i]!;

    // Check for CDATA
    if (xml.slice(i, i + 9) === '<![CDATA[') {
      if (current.trim()) {
        tokens.push(current);
        current = '';
      }
      let cdata = '';
      while (i < xml.length) {
        cdata += xml[i];
        if (xml.slice(i - 2, i + 1) === ']]>') {
          break;
        }
        i++;
      }
      tokens.push(cdata);
      i++;
      continue;
    }

    // Check for comment
    if (xml.slice(i, i + 4) === '<!--') {
      if (current.trim()) {
        tokens.push(current);
        current = '';
      }
      let comment = '';
      while (i < xml.length) {
        comment += xml[i];
        if (xml.slice(i - 2, i + 1) === '-->') {
          break;
        }
        i++;
      }
      tokens.push(comment);
      i++;
      continue;
    }

    // Handle tag start
    if (char === '<') {
      if (current.trim()) {
        tokens.push(current);
      }
      current = '<';
      i++;
      continue;
    }

    // Handle tag end
    if (char === '>') {
      current += '>';
      tokens.push(current);
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current.trim()) {
    tokens.push(current);
  }

  return tokens;
}

export function minifyXML(xml: string): string {
  if (!xml.trim()) return '';

  // Remove comments (but keep CDATA)
  let result = xml.replace(/<!--[\s\S]*?-->/g, '');

  // Collapse whitespace between tags
  result = result.replace(/>\s+</g, '><');

  // Remove leading/trailing whitespace from text content
  result = result.replace(/>\s+/g, '>').replace(/\s+</g, '<');

  return result.trim();
}

const tool: ToolDefinition = {
  id: 'xml-formatter',
  name: 'XML Formatter',
  description: 'Format and minify XML documents',
  category: 'json',
  keywords: ['xml', 'format', 'beautify', 'minify', 'markup', 'indent'],
  icon: 'FileCode',
  component: () => import('./XmlFormatter'),
};

export default tool;
