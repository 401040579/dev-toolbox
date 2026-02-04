import type { ToolDefinition } from '@/tools/types';

async function computeHash(input: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const tool: ToolDefinition = {
  id: 'hash-generator',
  name: 'Hash Generator',
  description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes using Web Crypto API',
  category: 'generators',
  keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'sha1', 'checksum', 'digest'],
  icon: 'Hash',
  component: () => import('./HashGenerator'),
  transforms: [
    {
      id: 'hash-sha256',
      name: 'SHA-256 Hash',
      description: 'Compute SHA-256 hash of input',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => computeHash(input, 'SHA-256'),
    },
    {
      id: 'hash-sha512',
      name: 'SHA-512 Hash',
      description: 'Compute SHA-512 hash of input',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => computeHash(input, 'SHA-512'),
    },
    {
      id: 'hash-sha1',
      name: 'SHA-1 Hash',
      description: 'Compute SHA-1 hash of input',
      inputType: 'string',
      outputType: 'string',
      transform: (input: string) => computeHash(input, 'SHA-1'),
    },
  ],
};

export default tool;
