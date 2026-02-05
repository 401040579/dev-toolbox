import type { ToolDefinition } from '@/tools/types';

export interface ParsedHeader {
  name: string;
  value: string;
  description?: string;
}

const HEADER_DESCRIPTIONS: Record<string, string> = {
  'accept': 'Media types the client can handle',
  'accept-encoding': 'Compression algorithms the client supports',
  'accept-language': 'Preferred languages for the response',
  'authorization': 'Credentials for authentication',
  'cache-control': 'Caching directives',
  'content-type': 'Media type of the request/response body',
  'content-length': 'Size of the body in bytes',
  'content-encoding': 'Compression algorithm used on the body',
  'cookie': 'Cookies sent by the client',
  'host': 'Domain name and port of the server',
  'origin': 'Origin of the request (for CORS)',
  'referer': 'URL of the previous page',
  'user-agent': 'Client application information',
  'x-forwarded-for': 'Original client IP (via proxy)',
  'x-requested-with': 'Indicates AJAX request',
  'set-cookie': 'Cookie to be stored by the client',
  'access-control-allow-origin': 'Allowed origins for CORS',
  'access-control-allow-methods': 'Allowed HTTP methods for CORS',
  'access-control-allow-headers': 'Allowed headers for CORS',
  'strict-transport-security': 'HSTS policy',
  'content-security-policy': 'CSP rules for the page',
  'x-content-type-options': 'Prevents MIME type sniffing',
  'x-frame-options': 'Clickjacking protection',
  'x-xss-protection': 'XSS filter control',
  'etag': 'Resource version identifier',
  'last-modified': 'Last modification timestamp',
  'expires': 'Response expiration date',
  'location': 'Redirect URL',
  'www-authenticate': 'Authentication method required',
};

export function parseHeaders(input: string): ParsedHeader[] {
  const headers: ParsedHeader[] = [];
  const lines = input.split(/\r?\n/).filter((line) => line.trim());

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const name = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    headers.push({
      name,
      value,
      description: HEADER_DESCRIPTIONS[name.toLowerCase()],
    });
  }

  return headers;
}

export function formatHeaders(headers: ParsedHeader[]): string {
  return headers.map((h) => `${h.name}: ${h.value}`).join('\n');
}

const tool: ToolDefinition = {
  id: 'http-headers',
  name: 'HTTP Header Parser',
  description: 'Parse and analyze HTTP headers',
  category: 'network',
  keywords: ['http', 'header', 'parse', 'request', 'response', 'cors', 'cache'],
  icon: 'FileText',
  component: () => import('./HttpHeaders'),
};

export default tool;
