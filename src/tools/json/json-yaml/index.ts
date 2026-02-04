import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'json-yaml',
  name: 'JSON ↔ YAML',
  description: 'Convert between JSON and YAML formats',
  category: 'json',
  keywords: ['json', 'yaml', 'yml', 'convert', 'transform'],
  icon: 'ArrowLeftRight',
  component: () => import('./JsonYaml'),
  transforms: [
    {
      id: 'json-to-yaml',
      name: 'JSON → YAML',
      description: 'Convert JSON to YAML',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => {
        const obj = JSON.parse(input);
        return jsonToYaml(obj, 0);
      },
    },
  ],
};

function jsonToYaml(value: unknown, indent: number): string {
  const prefix = '  '.repeat(indent);

  if (value === null) return 'null';
  if (value === undefined) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (value.includes('\n') || value.includes(': ') || value.includes('#') ||
        value.startsWith('{') || value.startsWith('[') || value.startsWith('"') ||
        value.startsWith("'") || value === '' || value === 'true' || value === 'false' ||
        value === 'null' || !isNaN(Number(value))) {
      return JSON.stringify(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((item) => {
        const yaml = jsonToYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return `${prefix}- ${yaml.trimStart()}`;
        }
        return `${prefix}- ${yaml}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, val]) => {
        const yamlVal = jsonToYaml(val, indent + 1);
        if (typeof val === 'object' && val !== null) {
          return `${prefix}${key}:\n${yamlVal}`;
        }
        return `${prefix}${key}: ${yamlVal}`;
      })
      .join('\n');
  }

  return String(value);
}

export { jsonToYaml };
export default tool;
