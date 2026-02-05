import type { ToolDefinition } from '@/tools/types';

export interface FormatOptions {
  indent: string;
  newlineBetweenRules: boolean;
}

export function formatCSS(css: string, options: Partial<FormatOptions> = {}): string {
  const { indent = '  ', newlineBetweenRules = true } = options;

  if (!css.trim()) return '';

  // Remove comments temporarily and track their positions
  const comments: Array<{ placeholder: string; content: string }> = [];
  let processed = css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const placeholder = `__COMMENT_${comments.length}__`;
    comments.push({ placeholder, content: match });
    return placeholder;
  });

  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ');

  // Format
  let result = '';
  let depth = 0;
  let inValue = false;
  let buffer = '';

  for (let i = 0; i < processed.length; i++) {
    const char = processed[i]!;
    const nextChar = processed[i + 1] || '';

    if (char === '{') {
      buffer = buffer.trim();
      if (buffer) {
        result += buffer + ' ';
        buffer = '';
      }
      result += '{\n';
      depth++;
      inValue = false;
    } else if (char === '}') {
      buffer = buffer.trim();
      if (buffer) {
        result += indent.repeat(depth) + buffer;
        if (!buffer.endsWith(';')) result += ';';
        result += '\n';
        buffer = '';
      }
      depth = Math.max(0, depth - 1);
      result += indent.repeat(depth) + '}';
      if (newlineBetweenRules && depth === 0 && nextChar && nextChar !== '}') {
        result += '\n\n';
      } else {
        result += '\n';
      }
      inValue = false;
    } else if (char === ';') {
      buffer = buffer.trim();
      if (buffer) {
        result += indent.repeat(depth) + buffer + ';\n';
        buffer = '';
      }
      inValue = false;
    } else if (char === ':' && !inValue) {
      buffer += ': ';
      inValue = true;
    } else {
      buffer += char;
    }
  }

  // Handle remaining buffer
  buffer = buffer.trim();
  if (buffer) {
    result += buffer;
  }

  // Restore comments
  for (const { placeholder, content } of comments) {
    result = result.replace(placeholder, content);
  }

  return result.trim();
}

export function minifyCSS(css: string): string {
  if (!css.trim()) return '';

  let result = css;

  // Remove comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove whitespace
  result = result.replace(/\s+/g, ' ');

  // Remove spaces around special characters
  result = result.replace(/\s*([{};:,>+~])\s*/g, '$1');

  // Remove semicolon before closing brace
  result = result.replace(/;}/g, '}');

  // Remove leading/trailing spaces
  result = result.trim();

  return result;
}

const tool: ToolDefinition = {
  id: 'css-formatter',
  name: 'CSS Formatter',
  description: 'Format and minify CSS stylesheets',
  category: 'json',
  keywords: ['css', 'format', 'beautify', 'minify', 'stylesheet', 'style'],
  icon: 'Palette',
  component: () => import('./CssFormatter'),
};

export default tool;
