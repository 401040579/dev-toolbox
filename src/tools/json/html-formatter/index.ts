import type { ToolDefinition } from '@/tools/types';

export interface FormatOptions {
  indent: string;
  preserveNewlines: boolean;
}

// Void elements that don't have closing tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
]);

// Elements that should preserve their content exactly
const PRESERVE_CONTENT = new Set(['pre', 'code', 'script', 'style', 'textarea']);

export function formatHTML(html: string, options: Partial<FormatOptions> = {}): string {
  const { indent = '  ', preserveNewlines = false } = options;

  if (!html.trim()) return '';

  // Tokenize HTML
  const tokens = tokenize(html);
  let result = '';
  let indentLevel = 0;
  let preserveMode = false;
  let preserveTag = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;

    // Handle preserve mode (pre, code, script, style)
    if (preserveMode) {
      result += token;
      if (token.toLowerCase().startsWith(`</${preserveTag}`)) {
        preserveMode = false;
        preserveTag = '';
      }
      continue;
    }

    // Handle text content
    if (!token.startsWith('<')) {
      const trimmed = preserveNewlines ? token : token.trim();
      if (trimmed) {
        result += trimmed;
      }
      continue;
    }

    // Handle comments
    if (token.startsWith('<!--')) {
      result += '\n' + indent.repeat(indentLevel) + token;
      continue;
    }

    // Handle doctype
    if (token.toLowerCase().startsWith('<!doctype')) {
      result += token + '\n';
      continue;
    }

    // Handle closing tags
    if (token.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
      result = result.trimEnd();
      result += '\n' + indent.repeat(indentLevel) + token;
      continue;
    }

    // Handle opening tags
    const tagMatch = token.match(/^<(\w+)/);
    if (tagMatch) {
      const tagName = tagMatch[1]!.toLowerCase();

      // Check if we should preserve content
      if (PRESERVE_CONTENT.has(tagName)) {
        preserveMode = true;
        preserveTag = tagName;
      }

      result = result.trimEnd();
      if (result) result += '\n';
      result += indent.repeat(indentLevel) + token;

      // Don't increase indent for void elements or self-closing
      if (!VOID_ELEMENTS.has(tagName) && !token.endsWith('/>')) {
        indentLevel++;
      }
    }
  }

  return result.trim();
}

function tokenize(html: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inTag = false;
  let inComment = false;

  for (let i = 0; i < html.length; i++) {
    const char = html[i]!;

    // Check for comment start
    if (!inTag && char === '<' && html.slice(i, i + 4) === '<!--') {
      if (current.trim()) {
        tokens.push(current);
        current = '';
      }
      inComment = true;
      current = '<!--';
      i += 3;
      continue;
    }

    // Check for comment end
    if (inComment && char === '-' && html.slice(i, i + 3) === '-->') {
      current += '-->';
      tokens.push(current);
      current = '';
      inComment = false;
      i += 2;
      continue;
    }

    if (inComment) {
      current += char;
      continue;
    }

    // Handle tag start
    if (char === '<' && !inTag) {
      if (current.trim()) {
        tokens.push(current);
      }
      current = '<';
      inTag = true;
      continue;
    }

    // Handle tag end
    if (char === '>' && inTag) {
      current += '>';
      tokens.push(current);
      current = '';
      inTag = false;
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current);
  }

  return tokens;
}

export function minifyHTML(html: string): string {
  if (!html.trim()) return '';

  // Remove comments
  let result = html.replace(/<!--[\s\S]*?-->/g, '');

  // Collapse whitespace (except in pre, code, script, style, textarea)
  const parts: string[] = [];
  const regex = /(<(?:pre|code|script|style|textarea)[^>]*>[\s\S]*?<\/(?:pre|code|script|style|textarea)>)|([^<]+)|(<[^>]+>)/gi;
  let match;

  while ((match = regex.exec(result)) !== null) {
    if (match[1]) {
      // Preserve content
      parts.push(match[1]);
    } else if (match[2]) {
      // Collapse whitespace in text
      parts.push(match[2].replace(/\s+/g, ' ').trim());
    } else if (match[3]) {
      // Tag - remove extra whitespace
      parts.push(match[3].replace(/\s+/g, ' ').replace(/\s+>/g, '>').replace(/\s+\/>/g, '/>'));
    }
  }

  return parts.join('').trim();
}

const tool: ToolDefinition = {
  id: 'html-formatter',
  name: 'HTML Formatter',
  description: 'Format and beautify HTML code',
  category: 'json',
  keywords: ['html', 'format', 'beautify', 'indent', 'minify', 'markup'],
  icon: 'Code',
  component: () => import('./HtmlFormatter'),
};

export default tool;
