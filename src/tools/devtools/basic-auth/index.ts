import type { ToolDefinition } from '@/tools/types';

export function generateBasicAuth(username: string, password: string): string {
  const encoded = btoa(`${username}:${password}`);
  return `Basic ${encoded}`;
}

export function decodeBasicAuth(header: string): { username: string; password: string } | null {
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = atob(match[1]!);
    const [username, ...rest] = decoded.split(':');
    return { username: username ?? '', password: rest.join(':') };
  } catch {
    return null;
  }
}

const tool: ToolDefinition = {
  id: 'basic-auth',
  name: 'Basic Auth Generator',
  description: 'Generate and decode HTTP Basic Authentication headers',
  category: 'devtools',
  keywords: ['basic', 'auth', 'authentication', 'header', 'http', 'authorization'],
  icon: 'Lock',
  component: () => import('./BasicAuth'),
};

export default tool;
