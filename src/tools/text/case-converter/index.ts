import type { ToolDefinition } from '@/tools/types';

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

function toCamelCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function toSnakeCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase();
}

function toKebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

function toConstantCase(s: string): string {
  return toSnakeCase(s).toUpperCase();
}

const tool: ToolDefinition = {
  id: 'case-converter',
  name: 'Case Converter',
  description: 'Convert text between camelCase, snake_case, kebab-case, and more',
  category: 'text',
  keywords: ['case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower', 'title', 'convert'],
  icon: 'CaseSensitive',
  component: () => import('./CaseConverter'),
  transforms: [
    { id: 'to-uppercase', name: 'To Uppercase', description: 'Convert to UPPERCASE', inputType: 'string', outputType: 'string', transform: (s) => s.toUpperCase() },
    { id: 'to-lowercase', name: 'To Lowercase', description: 'Convert to lowercase', inputType: 'string', outputType: 'string', transform: (s) => s.toLowerCase() },
    { id: 'to-title-case', name: 'To Title Case', description: 'Convert to Title Case', inputType: 'string', outputType: 'string', transform: toTitleCase },
    { id: 'to-camel-case', name: 'To camelCase', description: 'Convert to camelCase', inputType: 'string', outputType: 'string', transform: toCamelCase },
    { id: 'to-snake-case', name: 'To snake_case', description: 'Convert to snake_case', inputType: 'string', outputType: 'string', transform: toSnakeCase },
    { id: 'to-kebab-case', name: 'To kebab-case', description: 'Convert to kebab-case', inputType: 'string', outputType: 'string', transform: toKebabCase },
    { id: 'to-pascal-case', name: 'To PascalCase', description: 'Convert to PascalCase', inputType: 'string', outputType: 'string', transform: toPascalCase },
    { id: 'to-constant-case', name: 'To CONSTANT_CASE', description: 'Convert to CONSTANT_CASE', inputType: 'string', outputType: 'string', transform: toConstantCase },
  ],
};

export default tool;
