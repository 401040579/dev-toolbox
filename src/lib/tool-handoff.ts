/** Inputs stay in this tab's memory and are consumed by the destination once. */
export const MAX_TOOL_INPUT_BYTES = 1024 * 1024;

const allowedFields: Record<string, Readonly<Record<string, readonly string[] | null>>> = {
  'json-formatter': { input: null },
  'jwt-decode': { input: null },
  'epoch-converter': { input: null, mode: ['epoch-to-date'], activeTab: ['converter'] },
  'url-parser': { input: null },
  base64: { input: null, mode: ['decode'] },
  'text-stats': { input: null },
};

let pending: { toolId: string; fields: Record<string, unknown>; expires: number } | undefined;

export function isToolInputWithinLimit(input: string): boolean {
  // The first check avoids allocating another huge buffer for an oversized paste.
  return input.length <= MAX_TOOL_INPUT_BYTES
    && new TextEncoder().encode(input).byteLength <= MAX_TOOL_INPUT_BYTES;
}

export function queueToolInput(toolId: string, fields: Record<string, unknown>): void {
  const schema = Object.prototype.hasOwnProperty.call(allowedFields, toolId) ? allowedFields[toolId] : undefined;
  if (!schema || !fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new Error('Unsupported tool input');
  }
  const copy: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(fields)) {
    if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(schema, key)) {
      throw new Error('Unsupported tool input field');
    }
    const value = fields[key];
    const choices = schema[key];
    if (typeof value !== 'string' || (choices && !choices.includes(value))) {
      throw new Error('Invalid tool input field');
    }
    copy[key] = value;
  }
  if (typeof copy.input !== 'string' || !isToolInputWithinLimit(copy.input)) {
    throw new Error('Tool input exceeds the 1 MiB limit');
  }
  // Only the most recent selection can be delivered. It never enters a URL or storage.
  pending = { toolId, fields: copy, expires: Date.now() + 5 * 60 * 1000 };
}

export function consumeToolInput(toolId: string): Record<string, unknown> | undefined {
  if (pending && Date.now() > pending.expires) pending = undefined;
  if (!pending || pending.toolId !== toolId) return undefined;
  const fields = pending.fields;
  pending = undefined;
  return { ...fields };
}

/** Allows a React initializer to read safely before its committed effect consumes. */
export function peekToolInput(toolId: string): Record<string, unknown> | undefined {
  if (!pending || pending.toolId !== toolId || Date.now() > pending.expires) return undefined;
  return { ...pending.fields };
}
