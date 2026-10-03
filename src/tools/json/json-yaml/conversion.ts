import { CST, Lexer, isAlias, isCollection, isPair, isScalar, parseDocument, stringify, type Document } from 'yaml';
import { assertInputSize, checkedOutput, DATA_LIMITS, normalizeJson, parseJson, stringifyJson } from './structured-data';

const YAML_OPTIONS = {
  schema: 'core',
  version: '1.2',
  resolveKnownTags: false,
  merge: false,
  strict: true,
  uniqueKeys: true,
  stringKeys: true,
  intAsBigInt: true,
} as const;

function checkFlowDepth(input: string): void {
  let depth = 0;
  let scalarContents = false;
  // Use the official lexer so brackets in plain, quoted or block strings are
  // never mistaken for collections. Stop before constructing a very deep AST.
  for (const token of new Lexer().lex(input)) {
    if (scalarContents) {
      scalarContents = false;
      continue;
    }
    if (token === CST.SCALAR) scalarContents = true;
    else if (token === '[' || token === '{') {
      if (++depth > DATA_LIMITS.depth) throw new Error(`Data exceeds ${DATA_LIMITS.depth} levels.`);
    } else if (token === ']' || token === '}') depth = Math.max(0, depth - 1);
    else if (token === CST.DOCUMENT || token === CST.FLOW_END) depth = 0;
  }
}

// Inspect expanded aliases before toJS so its shared references cannot conceal
// oversized JSON output. This iterative walk also handles deep invalid documents.
function inspectYaml(document: Document): void {
  const ancestors = new WeakSet<object>();
  const stack: { node: unknown; depth: number; leaving?: boolean }[] = [{ node: document.contents, depth: 0 }];
  let nodes = 0;
  let aliases = 0;
  let textLength = 0;
  while (stack.length) {
    const { node, depth, leaving } = stack.pop()!;
    if (typeof node !== 'object' || node === null) continue;
    if (leaving) {
      ancestors.delete(node);
      continue;
    }
    if (depth > DATA_LIMITS.depth) throw new Error(`Data exceeds ${DATA_LIMITS.depth} levels.`);
    if (++nodes > DATA_LIMITS.nodes) throw new Error(`Expanded data exceeds ${DATA_LIMITS.nodes} values.`);
    if (ancestors.has(node)) throw new Error('Circular YAML aliases cannot be represented in JSON.');
    ancestors.add(node);
    stack.push({ node, depth, leaving: true });
    if (isAlias(node)) {
      if (++aliases > DATA_LIMITS.aliases) throw new Error(`YAML alias expansion exceeds ${DATA_LIMITS.aliases} references.`);
      const target = node.resolve(document);
      if (!target) throw new Error(`Unresolved YAML alias: ${node.source}.`);
      stack.push({ node: target, depth });
    } else if (isCollection(node)) {
      for (let i = node.items.length - 1; i >= 0; i--) stack.push({ node: node.items[i], depth: depth + 1 });
    } else if (isPair(node)) {
      // A map pair is metadata rather than another container level.
      stack.push({ node: node.value, depth }, { node: node.key, depth });
    } else if (isScalar(node) && typeof node.value === 'string') {
      textLength += node.value.length;
      if (textLength > DATA_LIMITS.outputBytes) throw new Error('Expanded data exceeds the 4 MiB limit.');
    }
  }
}

export function parseYaml(input: string) {
  assertInputSize(input);
  checkFlowDepth(input);
  const document = parseDocument(input, YAML_OPTIONS);
  if (document.errors.length) throw document.errors[0];
  // Unsupported tags/directives otherwise cause a silent fallback in yaml.
  if (document.warnings.length) throw document.warnings[0];
  if (document.directives?.yaml.version !== '1.2') throw new Error('Only YAML 1.2 documents are supported.');
  inspectYaml(document);
  return normalizeJson(document.toJS({ mapAsMap: true, maxAliasCount: DATA_LIMITS.aliases }));
}

export function jsonToYaml(value: unknown): string {
  return checkedOutput(stringify(normalizeJson(value), {
    ...YAML_OPTIONS,
    aliasDuplicateObjects: false,
    doubleQuotedAsJSON: true,
    lineWidth: 0,
  }).trimEnd());
}

export type JsonYamlMode = 'json-to-yaml' | 'yaml-to-json';

export function convertJsonYaml(input: string, mode: JsonYamlMode): string {
  return mode === 'json-to-yaml' ? jsonToYaml(parseJson(input)) : stringifyJson(parseYaml(input));
}
