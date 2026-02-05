import type { ToolDefinition } from '@/tools/types';

export function parseQueryString(input: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const query = input.startsWith('?') ? input.slice(1) : input;

  if (!query) return result;

  query.split('&').forEach((pair) => {
    const [key, ...valueParts] = pair.split('=');
    if (!key) return;

    const decodedKey = decodeURIComponent(key);
    const value = valueParts.join('=');
    const decodedValue = value ? decodeURIComponent(value) : '';

    if (!result[decodedKey]) {
      result[decodedKey] = [];
    }
    result[decodedKey]!.push(decodedValue);
  });

  return result;
}

export function buildQueryString(params: Record<string, string[]>): string {
  const parts: string[] = [];

  Object.entries(params).forEach(([key, values]) => {
    values.forEach((value) => {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
  });

  return parts.join('&');
}

const tool: ToolDefinition = {
  id: 'query-string',
  name: 'Query String Parser',
  description: 'Parse and build URL query strings',
  category: 'network',
  keywords: ['query', 'string', 'url', 'params', 'parameters', 'parse', 'build'],
  icon: 'Search',
  component: () => import('./QueryString'),
};

export default tool;
