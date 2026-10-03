export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type ChangeKind = 'added' | 'removed' | 'modified';
export type DiffFilter = 'all' | ChangeKind;
export type JsonChange =
  | { kind: 'added'; path: string; after: JsonValue }
  | { kind: 'removed'; path: string; before: JsonValue }
  | { kind: 'modified'; path: string; before: JsonValue; after: JsonValue };

export interface JsonDiffReport {
  version: 1;
  equal: boolean;
  counts: { total: number; added: number; removed: number; modified: number };
  changes: JsonChange[];
}

export const JSON_DIFF_LIMITS = {
  inputBytes: 1024 * 1024,
  nodes: 20_000,
  depth: 64,
  changes: 500,
  pathCharacters: 4096,
  reportBytes: 4 * 1024 * 1024,
} as const;

export type JsonDiffErrorCode =
  | 'invalidJson' | 'inputTooLarge' | 'tooDeep' | 'tooManyNodes'
  | 'unsupportedNumber' | 'tooManyChanges' | 'pathTooLong' | 'reportTooLarge';

export class JsonDiffError extends Error {
  constructor(
    public readonly code: JsonDiffErrorCode,
    public readonly side?: 'left' | 'right',
    public readonly detail?: string,
  ) {
    super(code);
    this.name = 'JsonDiffError';
  }
}

// Check nesting before native JSON.parse, without treating brackets inside a
// quoted or escaped string as containers. JSON.parse remains the syntax parser.
function checkDepth(input: string, side: 'left' | 'right') {
  let quoted = false;
  let escaped = false;
  let depth = 0;
  for (const char of input) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '[' || char === '{') {
      depth += 1;
      if (depth > JSON_DIFF_LIMITS.depth) throw new JsonDiffError('tooDeep', side);
    } else if (char === ']' || char === '}') depth -= 1;
  }
}

// Compare decimal values without converting the coefficient to a floating
// point value. Equivalent notation (1, 1.0, 10e-1) has the same canonical form.
function canonicalDecimal(token: string, side: 'left' | 'right'): string {
  const negative = token[0] === '-';
  const exponentIndex = token.search(/[eE]/);
  const mantissa = token.slice(negative ? 1 : 0, exponentIndex === -1 ? undefined : exponentIndex);
  const pointIndex = mantissa.indexOf('.');
  const fractionDigits = pointIndex === -1 ? 0 : mantissa.length - pointIndex - 1;
  const digits = pointIndex === -1 ? mantissa : mantissa.slice(0, pointIndex) + mantissa.slice(pointIndex + 1);
  let first = 0;
  while (first < digits.length && digits[first] === '0') first++;
  // Zero stays zero even with an enormous exponent, and -0 equals +0.
  if (first === digits.length) return '0';
  let end = digits.length;
  while (end > first && digits[end - 1] === '0') end--;

  let exponent = 0;
  if (exponentIndex !== -1) {
    let start = exponentIndex + 1;
    const exponentNegative = token[start] === '-';
    if (token[start] === '+' || exponentNegative) start++;
    while (start < token.length && token[start] === '0') start++;
    // A permitted input cannot have enough fractional digits to balance an
    // exponent beyond this bound. Never allocate a BigInt for attacker input.
    if (token.length - start > 7) throw new JsonDiffError('unsupportedNumber', side);
    const magnitude = start === token.length ? 0 : Number(token.slice(start));
    if (magnitude > JSON_DIFF_LIMITS.inputBytes * 2) throw new JsonDiffError('unsupportedNumber', side);
    exponent = exponentNegative ? -magnitude : magnitude;
  }
  const power = exponent - fractionDigits + digits.length - end;
  return `${negative ? '-' : ''}${digits.slice(first, end)}e${power}`;
}

// Syntax has already been validated by JSON.parse. Scan only numeric tokens,
// skipping quoted strings and escaped characters in one bounded forward pass.
function checkNumberPrecision(input: string, side: 'left' | 'right') {
  const numberToken = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  for (let index = 0; index < input.length; index++) {
    if (input[index] === '"') {
      index++;
      while (index < input.length && input[index] !== '"') {
        index += input[index] === '\\' ? 2 : 1;
      }
    } else if (input[index] === '-' || (input[index]! >= '0' && input[index]! <= '9')) {
      numberToken.lastIndex = index;
      const token = numberToken.exec(input)?.[0];
      if (!token) throw new JsonDiffError('unsupportedNumber', side);
      const value = Number(token);
      if (!Number.isFinite(value) || canonicalDecimal(token, side) !== canonicalDecimal(value.toString(), side)) {
        throw new JsonDiffError('unsupportedNumber', side);
      }
      index += token.length - 1;
    }
  }
}

export function parseJsonInput(input: string, side: 'left' | 'right'): JsonValue {
  // The cheap character bound avoids allocating another enormous string buffer.
  if (input.length > JSON_DIFF_LIMITS.inputBytes || new TextEncoder().encode(input).byteLength > JSON_DIFF_LIMITS.inputBytes) {
    throw new JsonDiffError('inputTooLarge', side);
  }
  checkDepth(input, side);
  let parsed: JsonValue;
  try { parsed = JSON.parse(input) as JsonValue; }
  catch (error) { throw new JsonDiffError('invalidJson', side, error instanceof Error ? error.message : undefined); }
  checkNumberPrecision(input, side);

  const pending: JsonValue[] = [parsed];
  let visited = 0;
  while (pending.length) {
    const value = pending.pop()!;
    visited += 1;
    if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) {
      throw new JsonDiffError('unsupportedNumber', side);
    }
    if (value !== null && typeof value === 'object') {
      const keys = Array.isArray(value) ? null : Object.keys(value);
      const childCount = keys ? keys.length : (value as JsonValue[]).length;
      if (visited + pending.length + childCount > JSON_DIFF_LIMITS.nodes) throw new JsonDiffError('tooManyNodes', side);
      // Push only after the node budget is checked, including queued siblings.
      if (keys) for (const key of keys) pending.push((value as Record<string, JsonValue>)[key]!);
      else for (const child of value as JsonValue[]) pending.push(child);
    }
  }
  return parsed;
}

function formatPath(parts: (string | number)[]): string {
  let path = '$';
  for (const part of parts) {
    if (typeof part === 'string' && part.length > JSON_DIFF_LIMITS.pathCharacters) throw new JsonDiffError('pathTooLong');
    const segment = typeof part === 'number'
      ? `[${part}]`
      : /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(part) && !['__proto__', 'constructor', 'prototype'].includes(part)
        ? `.${part}`
        : `[${JSON.stringify(part)}]`;
    if (path.length + segment.length > JSON_DIFF_LIMITS.pathCharacters) throw new JsonDiffError('pathTooLong');
    path += segment;
  }
  return path;
}

export function compareJson(leftInput: string, rightInput: string): JsonDiffReport {
  const left = parseJsonInput(leftInput, 'left');
  const right = parseJsonInput(rightInput, 'right');
  const changes: JsonChange[] = [];
  const counts = { total: 0, added: 0, removed: 0, modified: 0 };
  const add = (parts: (string | number)[], change: Omit<Extract<JsonChange, { kind: 'added' }>, 'path'> | Omit<Extract<JsonChange, { kind: 'removed' }>, 'path'> | Omit<Extract<JsonChange, { kind: 'modified' }>, 'path'>) => {
    if (changes.length >= JSON_DIFF_LIMITS.changes) throw new JsonDiffError('tooManyChanges');
    changes.push({ ...change, path: formatPath(parts) });
    counts[change.kind] += 1;
    counts.total += 1;
  };
  const walk = (before: JsonValue, after: JsonValue, parts: (string | number)[]) => {
    if (before === after) return;
    if (Array.isArray(before) && Array.isArray(after)) {
      const length = Math.max(before.length, after.length);
      for (let index = 0; index < length; index += 1) {
        const next = [...parts, index];
        if (index >= before.length) add(next, { kind: 'added', after: after[index]! });
        else if (index >= after.length) add(next, { kind: 'removed', before: before[index]! });
        else walk(before[index]!, after[index]!, next);
      }
      return;
    }
    if (before !== null && after !== null && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
      const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
      for (const key of keys) {
        const next = [...parts, key];
        if (!Object.prototype.hasOwnProperty.call(before, key)) add(next, { kind: 'added', after: after[key]! });
        else if (!Object.prototype.hasOwnProperty.call(after, key)) add(next, { kind: 'removed', before: before[key]! });
        else walk(before[key]!, after[key]!, next);
      }
      return;
    }
    add(parts, { kind: 'modified', before, after });
  };
  walk(left, right, []);
  return { version: 1, equal: changes.length === 0, counts, changes };
}

export function serializeJsonDiffReport(report: JsonDiffReport): string {
  const output = JSON.stringify(report, null, 2);
  if (output.length > JSON_DIFF_LIMITS.reportBytes || new TextEncoder().encode(output).byteLength > JSON_DIFF_LIMITS.reportBytes) {
    throw new JsonDiffError('reportTooLarge');
  }
  return output;
}

export const JSON_DIFF_EXAMPLE = {
  left: JSON.stringify({ orderId: 'DEMO-1042', status: 'pending', total: 18.5, items: [{ sku: 'A', qty: 1 }], note: null, 'delivery.zone': 'west' }, null, 2),
  right: JSON.stringify({ items: [{ qty: 2, sku: 'A' }], total: 18.5, orderId: 'DEMO-1042', status: 'paid', receipt: 'DEMO-R-12', 'delivery.zone': 'east' }, null, 2),
};
