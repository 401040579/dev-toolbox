import { parse, stringify } from 'smol-toml';
import { jsonToYaml, parseYaml } from '../json-yaml/conversion';
import {
  assertInputSize,
  checkedOutput,
  DATA_LIMITS,
  normalizeJson,
  parseJson,
  stringifyJson,
  type JsonObject,
} from '../json-yaml/structured-data';

function assertTomlStrings(value: unknown): void {
  function checkString(text: string): void {
    // TOML requires Unicode scalar values. The dumper otherwise replaces lone
    // UTF-16 surrogates with U+FFFD, which would silently change valid JSON.
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = text.charCodeAt(++i);
        if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('TOML strings cannot contain lone Unicode surrogates.');
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        throw new Error('TOML strings cannot contain lone Unicode surrogates.');
      }
    }
  }
  if (typeof value === 'string') checkString(value);
  else if (Array.isArray(value)) value.forEach(assertTomlStrings);
  else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      checkString(key);
      assertTomlStrings(child);
    }
  }
}

export function parseTOML(input: string): JsonObject {
  assertInputSize(input);
  // The parser creates null-prototype tables; dangerous-looking keys stay data.
  // Large integers are kept exact until JSON compatibility is checked.
  return normalizeJson(parse(input, {
    unsafeKeyBehaviour: 'keep',
    integersAsBigInt: 'asNeeded',
    useLegacyDate: true,
    maxDepth: DATA_LIMITS.depth,
  })) as JsonObject;
}

export function stringifyTOML(value: unknown): string {
  const object = normalizeJson(value, false);
  if (object === null || typeof object !== 'object' || Array.isArray(object)) {
    throw new Error('TOML requires an object at the document root.');
  }
  assertTomlStrings(object);
  // smol-toml silently omits object nulls by default. Validation above rejects
  // them, unsupported types and non-finite numbers before serializing any key.
  return checkedOutput(stringify(object, { maxDepth: DATA_LIMITS.depth + 1 }).trimEnd());
}

export type ConversionMode = 'toml-to-json' | 'json-to-toml' | 'toml-to-yaml' | 'yaml-to-toml';

export function convert(input: string, mode: ConversionMode): string {
  switch (mode) {
    case 'toml-to-json':
      return stringifyJson(parseTOML(input));
    case 'json-to-toml':
      return stringifyTOML(parseJson(input));
    case 'toml-to-yaml':
      return jsonToYaml(parseTOML(input));
    case 'yaml-to-toml':
      return stringifyTOML(parseYaml(input));
  }
}
