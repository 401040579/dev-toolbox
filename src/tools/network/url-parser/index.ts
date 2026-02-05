import type { ToolDefinition } from '@/tools/types';

export interface ParsedURL {
  href: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  username: string;
  password: string;
  searchParams: Record<string, string[]>;
}

export function parseURL(input: string): ParsedURL | null {
  try {
    const url = new URL(input);
    const searchParams: Record<string, string[]> = {};

    url.searchParams.forEach((value, key) => {
      if (!searchParams[key]) {
        searchParams[key] = [];
      }
      searchParams[key]!.push(value);
    });

    return {
      href: url.href,
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      username: url.username,
      password: url.password,
      searchParams,
    };
  } catch {
    return null;
  }
}

const tool: ToolDefinition = {
  id: 'url-parser',
  name: 'URL Parser',
  description: 'Parse URLs into components (protocol, host, path, query, etc.)',
  category: 'network',
  keywords: ['url', 'parse', 'uri', 'query', 'path', 'hostname', 'protocol'],
  icon: 'Link',
  component: () => import('./UrlParser'),
};

export default tool;
