// All structured converters use these limits before rendering or serializing data.
export const DATA_LIMITS = {
  inputBytes: 1024 * 1024,
  outputBytes: 4 * 1024 * 1024,
  depth: 64,
  nodes: 50_000,
  aliases: 100,
} as const;

export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

const encoder = new TextEncoder();

export function assertInputSize(input: string): void {
  if (input.length > DATA_LIMITS.inputBytes || encoder.encode(input).length > DATA_LIMITS.inputBytes) {
    throw new Error('Input exceeds the 1 MiB UTF-8 limit.');
  }
}

export function checkedOutput(output: string): string {
  if (output.length > DATA_LIMITS.outputBytes || encoder.encode(output).length > DATA_LIMITS.outputBytes) {
    throw new Error('Output exceeds the 4 MiB UTF-8 limit.');
  }
  return output;
}

/** Copy only JSON values, expanding shared references within a bounded budget.
 * Defining own properties preserves __proto__ as data without invoking its setter.
 */
export function normalizeJson(value: unknown, allowNull = true): JsonValue {
  let nodes = 0;
  let textBytes = 0;
  const ancestors = new WeakSet<object>();

  function countText(text: string): void {
    textBytes += encoder.encode(text).length;
    if (textBytes > DATA_LIMITS.outputBytes) throw new Error('Expanded data exceeds the 4 MiB UTF-8 limit.');
  }

  function copy(item: unknown, depth: number, path: string): JsonValue {
    if (depth > DATA_LIMITS.depth) throw new Error(`Data exceeds ${DATA_LIMITS.depth} levels at ${path}.`);
    if (++nodes > DATA_LIMITS.nodes) throw new Error(`Expanded data exceeds ${DATA_LIMITS.nodes} values.`);
    if (item === null) {
      if (!allowNull) throw new Error(`TOML cannot represent null at ${path}.`);
      return null;
    }
    if (typeof item === 'string') {
      countText(item);
      return item;
    }
    if (typeof item === 'boolean') return item;
    if (typeof item === 'bigint') {
      if (item < BigInt(Number.MIN_SAFE_INTEGER) || item > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(`Integer at ${path} exceeds the safe JSON number range; quote it as a string.`);
      }
      return Number(item);
    }
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) throw new Error(`Non-finite number at ${path} cannot be represented in JSON.`);
      if (Number.isInteger(item) && !Number.isSafeInteger(item)) {
        throw new Error(`Integer at ${path} exceeds the safe JSON number range; quote it as a string.`);
      }
      return item;
    }
    if (typeof item !== 'object') throw new Error(`Unsupported JSON value at ${path}.`);
    if (ancestors.has(item)) throw new Error(`Circular reference at ${path} cannot be represented in JSON.`);
    if (!Array.isArray(item) && !(item instanceof Map) &&
        Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
      throw new Error(`Unsupported value at ${path}; use a quoted string for dates and times.`);
    }
    ancestors.add(item);
    try {
      if (Array.isArray(item)) return item.map((child, index) => copy(child, depth + 1, `${path}[${index}]`));
      const result: JsonObject = {};
      const entries = item instanceof Map ? item.entries() : Object.entries(item);
      for (const [key, child] of entries) {
        if (typeof key !== 'string') throw new Error(`Only string mapping keys are supported at ${path}.`);
        countText(key);
        Object.defineProperty(result, key, {
          value: copy(child, depth + 1, `${path}[${JSON.stringify(key)}]`),
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      return result;
    } finally {
      ancestors.delete(item);
    }
  }
  return copy(value, 0, '$');
}

export function parseJson(input: string): JsonValue {
  assertInputSize(input);
  return normalizeJson(JSON.parse(input));
}

export function stringifyJson(value: unknown): string {
  return checkedOutput(JSON.stringify(normalizeJson(value), null, 2));
}
