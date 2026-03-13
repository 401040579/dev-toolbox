import type { ToolDefinition } from '@/tools/types';

// Simple math expression evaluator (no eval!)
export function evaluate(expr: string): number {
  const tokens = tokenize(expr);
  const result = parseExpression(tokens, 0);
  return result.value;
}

interface Token {
  type: 'number' | 'op' | 'paren';
  value: string;
}

interface ParseResult {
  value: number;
  pos: number;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');

  while (i < s.length) {
    const c = s[i]!;

    if (/\d/.test(c) || (c === '.' && i + 1 < s.length && /\d/.test(s[i + 1]!))) {
      let num = '';
      while (i < s.length && (/\d/.test(s[i]!) || s[i] === '.')) {
        num += s[i]!;
        i++;
      }
      tokens.push({ type: 'number', value: num });
    } else if ('+-*/%^'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
    } else if (c === '(' || c === ')') {
      tokens.push({ type: 'paren', value: c });
      i++;
    } else if (s.slice(i, i + 4) === 'sqrt') {
      tokens.push({ type: 'op', value: 'sqrt' });
      i += 4;
    } else if (s.slice(i, i + 3) === 'abs') {
      tokens.push({ type: 'op', value: 'abs' });
      i += 3;
    } else if (s.slice(i, i + 2) === 'pi') {
      tokens.push({ type: 'number', value: String(Math.PI) });
      i += 2;
    } else if (c === 'e' && (i + 1 >= s.length || !/[a-z]/i.test(s[i + 1]!))) {
      tokens.push({ type: 'number', value: String(Math.E) });
      i++;
    } else {
      i++;
    }
  }

  return tokens;
}

function parseExpression(tokens: Token[], pos: number): ParseResult {
  let result = parseTerm(tokens, pos);

  while (result.pos < tokens.length) {
    const token = tokens[result.pos];
    if (!token || token.type !== 'op' || (token.value !== '+' && token.value !== '-')) break;
    const right = parseTerm(tokens, result.pos + 1);
    result = {
      value: token.value === '+' ? result.value + right.value : result.value - right.value,
      pos: right.pos,
    };
  }

  return result;
}

function parseTerm(tokens: Token[], pos: number): ParseResult {
  let result = parsePower(tokens, pos);

  while (result.pos < tokens.length) {
    const token = tokens[result.pos];
    if (!token || token.type !== 'op' || (token.value !== '*' && token.value !== '/' && token.value !== '%')) break;
    const right = parsePower(tokens, result.pos + 1);
    if (token.value === '*') result = { value: result.value * right.value, pos: right.pos };
    else if (token.value === '/') result = { value: result.value / right.value, pos: right.pos };
    else result = { value: result.value % right.value, pos: right.pos };
  }

  return result;
}

function parsePower(tokens: Token[], pos: number): ParseResult {
  let result = parseUnary(tokens, pos);

  if (result.pos < tokens.length) {
    const token = tokens[result.pos];
    if (token && token.type === 'op' && token.value === '^') {
      const right = parsePower(tokens, result.pos + 1);
      result = { value: Math.pow(result.value, right.value), pos: right.pos };
    }
  }

  return result;
}

function parseUnary(tokens: Token[], pos: number): ParseResult {
  const token = tokens[pos];
  if (!token) return { value: 0, pos };

  // Unary minus
  if (token.type === 'op' && token.value === '-') {
    const result = parsePrimary(tokens, pos + 1);
    return { value: -result.value, pos: result.pos };
  }

  // Functions
  if (token.type === 'op' && (token.value === 'sqrt' || token.value === 'abs')) {
    const result = parsePrimary(tokens, pos + 1);
    const value = token.value === 'sqrt' ? Math.sqrt(result.value) : Math.abs(result.value);
    return { value, pos: result.pos };
  }

  return parsePrimary(tokens, pos);
}

function parsePrimary(tokens: Token[], pos: number): ParseResult {
  const token = tokens[pos];
  if (!token) return { value: 0, pos };

  if (token.type === 'number') {
    return { value: parseFloat(token.value), pos: pos + 1 };
  }

  if (token.type === 'paren' && token.value === '(') {
    const result = parseExpression(tokens, pos + 1);
    // Skip closing paren
    const nextPos = result.pos < tokens.length && tokens[result.pos]?.value === ')' ? result.pos + 1 : result.pos;
    return { value: result.value, pos: nextPos };
  }

  return { value: 0, pos: pos + 1 };
}

const tool: ToolDefinition = {
  id: 'math-evaluator',
  name: 'Math Evaluator',
  description: 'Evaluate mathematical expressions safely',
  category: 'math',
  keywords: ['math', 'calculate', 'expression', 'evaluate', 'calculator'],
  icon: 'Calculator',
  component: () => import('./MathEvaluator'),
};

export default tool;
