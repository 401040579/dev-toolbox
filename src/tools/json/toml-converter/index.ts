import type { ToolDefinition } from '@/tools/types';

// Simple TOML parser
export function parseTOML(toml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = result;
  const lines = toml.split('\n');

  for (let line of lines) {
    line = line.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Handle section headers [section] or [section.subsection]
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      const sectionPath = sectionMatch[1]!.split('.');
      currentSection = result;
      for (const part of sectionPath) {
        if (!(part in currentSection)) {
          currentSection[part] = {};
        }
        currentSection = currentSection[part] as Record<string, unknown>;
      }
      continue;
    }

    // Handle key-value pairs
    const kvMatch = line.match(/^([^=]+)=(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1]!.trim();
      const value = parseValue(kvMatch[2]!.trim());
      currentSection[key] = value;
    }
  }

  return result;
}

function parseValue(value: string): unknown {
  // String (quoted)
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Array
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    // Simple array parsing (doesn't handle nested arrays well)
    const items = splitArrayItems(inner);
    return items.map(item => parseValue(item.trim()));
  }

  // Integer
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  // Float
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Date/time (simplified)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }

  return value;
}

function splitArrayItems(str: string): string[] {
  const items: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i]!;

    if ((char === '"' || char === "'") && str[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (!inString) {
      if (char === '[') depth++;
      if (char === ']') depth--;
      if (char === ',' && depth === 0) {
        items.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    items.push(current.trim());
  }

  return items;
}

// Simple TOML serializer
export function stringifyTOML(obj: Record<string, unknown>, prefix = ''): string {
  let result = '';
  const sections: Array<[string, Record<string, unknown>]> = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sections.push([prefix ? `${prefix}.${key}` : key, value as Record<string, unknown>]);
    } else {
      result += `${key} = ${serializeValue(value)}\n`;
    }
  }

  for (const [sectionName, sectionValue] of sections) {
    result += `\n[${sectionName}]\n`;
    result += stringifyTOML(sectionValue, sectionName);
  }

  return result;
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(serializeValue).join(', ')}]`;
  }
  return String(value);
}

export type ConversionMode = 'toml-to-json' | 'json-to-toml' | 'toml-to-yaml' | 'yaml-to-toml';

export function convert(input: string, mode: ConversionMode): string {
  switch (mode) {
    case 'toml-to-json': {
      const obj = parseTOML(input);
      return JSON.stringify(obj, null, 2);
    }
    case 'json-to-toml': {
      const obj = JSON.parse(input);
      return stringifyTOML(obj).trim();
    }
    case 'toml-to-yaml': {
      const obj = parseTOML(input);
      return objectToYaml(obj);
    }
    case 'yaml-to-toml': {
      const obj = yamlToObject(input);
      return stringifyTOML(obj).trim();
    }
    default:
      throw new Error('Unknown conversion mode');
  }
}

// Simple YAML serializer
function objectToYaml(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => `${spaces}- ${objectToYaml(item, indent + 1).trimStart()}`).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${objectToYaml(value, indent + 1)}`;
        }
        if (Array.isArray(value)) {
          return `${spaces}${key}:\n${objectToYaml(value, indent + 1)}`;
        }
        return `${spaces}${key}: ${objectToYaml(value, indent)}`;
      })
      .join('\n');
  }

  return String(obj);
}

// Simple YAML parser
function yamlToObject(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [{ obj: result, indent: -1 }];

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    line = line.trim();

    // Handle list items
    if (line.startsWith('- ')) {
      const value = parseYamlValue(line.slice(2));
      const parent = findParentArray(stack, indent);
      if (Array.isArray(parent)) {
        parent.push(value);
      }
      continue;
    }

    // Handle key-value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const valueStr = line.slice(colonIndex + 1).trim();

      // Pop stack until we find appropriate parent
      while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1]!.obj;

      if (valueStr) {
        parent[key] = parseYamlValue(valueStr);
      } else {
        // Nested object
        const newObj: Record<string, unknown> = {};
        parent[key] = newObj;
        stack.push({ obj: newObj, indent });
      }
    }
  }

  return result;
}

function findParentArray(stack: Array<{ obj: Record<string, unknown>; indent: number }>, _indent: number): unknown[] | null {
  for (let i = stack.length - 1; i >= 0; i--) {
    const obj = stack[i]!.obj;
    const keys = Object.keys(obj);
    if (keys.length > 0) {
      const lastKey = keys[keys.length - 1]!;
      const lastValue = obj[lastKey];
      if (Array.isArray(lastValue)) {
        return lastValue;
      }
    }
  }
  return null;
}

function parseYamlValue(value: string): unknown {
  value = value.trim();

  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Quoted string
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Number
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Empty array/object
  if (value === '[]') return [];
  if (value === '{}') return {};

  return value;
}

const tool: ToolDefinition = {
  id: 'toml-converter',
  name: 'TOML Converter',
  description: 'Convert between TOML, JSON, and YAML',
  category: 'json',
  keywords: ['toml', 'json', 'yaml', 'convert', 'config', 'configuration'],
  icon: 'FileJson',
  component: () => import('./TomlConverter'),
};

export default tool;
