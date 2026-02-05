import type { ToolDefinition } from '@/tools/types';

export function generateToken(length: number, charset: string): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => charset[n % charset.length]).join('');
}

export function generateHexToken(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateBase64Token(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const tool: ToolDefinition = {
  id: 'token-generator',
  name: 'Token Generator',
  description: 'Generate cryptographically secure random tokens',
  category: 'crypto',
  keywords: ['token', 'random', 'secure', 'api', 'key', 'secret'],
  icon: 'Key',
  component: () => import('./TokenGenerator'),
};

export default tool;
