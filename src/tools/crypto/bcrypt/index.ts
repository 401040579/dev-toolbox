import type { ToolDefinition } from '@/tools/types';

// PBKDF2-based password hashing (Web Crypto compatible alternative to bcrypt)
// Format: $pbkdf2-sha256$iterations$salt$hash

export async function hashPassword(password: string, iterations: number = 100000): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hashArray));

  return `$pbkdf2-sha256$${iterations}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();

  // Parse the hash string
  const parts = hash.split('$');
  if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') {
    throw new Error('Invalid hash format');
  }

  const iterations = parseInt(parts[2]!, 10);
  const salt = Uint8Array.from(atob(parts[3]!), (c) => c.charCodeAt(0));
  const expectedHash = parts[4]!;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const hashB64 = btoa(String.fromCharCode(...hashArray));

  return hashB64 === expectedHash;
}

const tool: ToolDefinition = {
  id: 'bcrypt',
  name: 'Password Hash',
  description: 'Hash and verify passwords using PBKDF2-SHA256',
  category: 'crypto',
  keywords: ['password', 'hash', 'bcrypt', 'pbkdf2', 'verify', 'secure'],
  icon: 'ShieldCheck',
  component: () => import('./Bcrypt'),
};

export default tool;
