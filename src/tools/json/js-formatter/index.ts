import type { ToolDefinition } from '@/tools/types';

export interface FormatOptions {
  indent: string;
  semicolons: boolean;
}

export function formatJS(js: string, options: Partial<FormatOptions> = {}): string {
  const { indent = '  ', semicolons = true } = options;

  if (!js.trim()) return '';

  // Tokenize
  const tokens = tokenize(js);
  let result = '';
  let depth = 0;
  let isNewLine = true;
  let prevToken = '';

  const needsSpaceBefore = new Set([
    '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '+', '-', '*', '/',
    '%', '&&', '||', '??', '?', ':', 'in', 'of', 'instanceof', 'typeof',
    '=>', '+=', '-=', '*=', '/=', '?.',
  ]);

  const needsSpaceAfter = new Set([
    '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '+', '-', '*', '/',
    '%', '&&', '||', '??', ':', ',', 'const', 'let', 'var', 'function', 'class',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'return', 'throw',
    'new', 'typeof', 'instanceof', 'in', 'of', 'export', 'import', 'from', 'as',
    '=>', '+=', '-=', '*=', '/=',
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const nextToken = tokens[i + 1] || '';

    // Handle opening brace
    if (token === '{') {
      result = result.trimEnd() + ' {\n';
      depth++;
      isNewLine = true;
      prevToken = token;
      continue;
    }

    // Handle closing brace
    if (token === '}') {
      result = result.trimEnd();
      if (!result.endsWith('\n')) result += '\n';
      depth = Math.max(0, depth - 1);
      result += indent.repeat(depth) + '}';
      if (nextToken !== ';' && nextToken !== ',' && nextToken !== ')' && nextToken !== 'else' && nextToken !== 'catch' && nextToken !== 'finally') {
        result += '\n';
        isNewLine = true;
      }
      prevToken = token;
      continue;
    }

    // Handle opening parenthesis
    if (token === '(') {
      result += '(';
      prevToken = token;
      isNewLine = false;
      continue;
    }

    // Handle closing parenthesis
    if (token === ')') {
      result += ')';
      prevToken = token;
      continue;
    }

    // Handle opening bracket
    if (token === '[') {
      result += '[';
      prevToken = token;
      isNewLine = false;
      continue;
    }

    // Handle closing bracket
    if (token === ']') {
      result += ']';
      prevToken = token;
      continue;
    }

    // Handle semicolon
    if (token === ';') {
      if (semicolons) {
        result += ';\n';
      } else {
        result += '\n';
      }
      isNewLine = true;
      prevToken = token;
      continue;
    }

    // Handle comma
    if (token === ',') {
      result += ', ';
      prevToken = token;
      continue;
    }

    // Add indentation for new lines
    if (isNewLine && token.trim()) {
      result += indent.repeat(depth);
      isNewLine = false;
    }

    // Add space before if needed
    if (needsSpaceBefore.has(token) && prevToken && prevToken !== '(' && prevToken !== '[') {
      if (!result.endsWith(' ') && !result.endsWith('\n')) {
        result += ' ';
      }
    }

    result += token;

    // Add space after if needed
    if (needsSpaceAfter.has(token)) {
      result += ' ';
    }

    prevToken = token;
  }

  return result.trim();
}

function tokenize(js: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let i = 0;

  while (i < js.length) {
    const char = js[i]!;
    const nextChar = js[i + 1] || '';
    const twoChar = char + nextChar;

    // Handle string literals
    if (char === '"' || char === "'" || char === '`') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      let str = char;
      i++;
      while (i < js.length) {
        const c = js[i]!;
        str += c;
        if (c === char && js[i - 1] !== '\\') break;
        i++;
      }
      tokens.push(str);
      i++;
      continue;
    }

    // Handle comments
    if (twoChar === '//') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      let comment = '';
      while (i < js.length && js[i] !== '\n') {
        comment += js[i];
        i++;
      }
      tokens.push(comment);
      continue;
    }

    if (twoChar === '/*') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      let comment = '';
      while (i < js.length) {
        comment += js[i];
        if (js[i] === '*' && js[i + 1] === '/') {
          comment += '/';
          i += 2;
          break;
        }
        i++;
      }
      tokens.push(comment);
      continue;
    }

    // Handle multi-char operators
    const threeChar = char + nextChar + (js[i + 2] || '');
    if (['===', '!==', '...', '??.'].includes(threeChar)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(threeChar);
      i += 3;
      continue;
    }

    if (['==', '!=', '<=', '>=', '&&', '||', '??', '?.', '=>', '+=', '-=', '*=', '/=', '++', '--'].includes(twoChar)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(twoChar);
      i += 2;
      continue;
    }

    // Handle single-char operators and punctuation
    if ('{}[]();:,.=<>+-*/%?!&|'.includes(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
      i++;
      continue;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

export function minifyJS(js: string): string {
  if (!js.trim()) return '';

  // Remove single-line comments
  let result = js.replace(/\/\/.*$/gm, '');

  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // Collapse whitespace (but preserve string literals)
  const parts: string[] = [];
  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\s+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(result)) !== null) {
    // Add code before match
    if (match.index > lastIndex) {
      parts.push(result.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // String literal - preserve
      parts.push(match[1]);
    } else if (match[2]) {
      // Whitespace - check if needed
      const before = parts.join('');
      const after = result.slice(regex.lastIndex);
      const lastChar = before[before.length - 1] || '';
      const nextChar = after[0] || '';

      // Keep space if needed for keywords/identifiers
      if (/[a-zA-Z0-9_$]/.test(lastChar) && /[a-zA-Z0-9_$]/.test(nextChar)) {
        parts.push(' ');
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining code
  if (lastIndex < result.length) {
    parts.push(result.slice(lastIndex));
  }

  return parts.join('').trim();
}

const tool: ToolDefinition = {
  id: 'js-formatter',
  name: 'JavaScript Formatter',
  description: 'Format and minify JavaScript code',
  category: 'json',
  keywords: ['javascript', 'js', 'format', 'beautify', 'minify', 'code'],
  icon: 'FileCode',
  component: () => import('./JsFormatter'),
};

export default tool;
