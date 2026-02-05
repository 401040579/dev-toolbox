import type { ToolDefinition } from '@/tools/types';

export type AesMode = 'GCM' | 'CBC' | 'CTR';
export type KeySize = 128 | 192 | 256;

async function deriveKey(password: string, salt: Uint8Array, keySize: KeySize): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: keySize },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function aesEncrypt(
  plaintext: string,
  password: string,
  mode: AesMode = 'GCM',
  keySize: KeySize = 256
): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(mode === 'GCM' ? 12 : 16));

  const key = await deriveKey(password, salt, keySize);

  let algorithm: AesGcmParams | AesCbcParams | AesCtrParams;
  if (mode === 'GCM') {
    algorithm = { name: 'AES-GCM', iv };
  } else if (mode === 'CBC') {
    // Re-derive key for CBC
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const cbcKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-CBC', length: keySize },
      false,
      ['encrypt', 'decrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      cbcKey,
      encoder.encode(plaintext)
    );
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
  } else {
    // CTR mode
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const ctrKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-CTR', length: keySize },
      false,
      ['encrypt', 'decrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CTR', counter: iv, length: 64 },
      ctrKey,
      encoder.encode(plaintext)
    );
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  const encrypted = await crypto.subtle.encrypt(algorithm, key, encoder.encode(plaintext));

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function aesDecrypt(
  ciphertext: string,
  password: string,
  mode: AesMode = 'GCM',
  keySize: KeySize = 256
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const ivSize = mode === 'GCM' ? 12 : 16;

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 16 + ivSize);
  const encrypted = combined.slice(16 + ivSize);

  if (mode === 'CBC') {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const cbcKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-CBC', length: keySize },
      false,
      ['encrypt', 'decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      cbcKey,
      encrypted
    );
    return decoder.decode(decrypted);
  } else if (mode === 'CTR') {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const ctrKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-CTR', length: keySize },
      false,
      ['encrypt', 'decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CTR', counter: iv, length: 64 },
      ctrKey,
      encrypted
    );
    return decoder.decode(decrypted);
  }

  const key = await deriveKey(password, salt, keySize);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}

const tool: ToolDefinition = {
  id: 'aes',
  name: 'AES Encrypt/Decrypt',
  description: 'Encrypt and decrypt text using AES (GCM/CBC/CTR modes)',
  category: 'crypto',
  keywords: ['aes', 'encrypt', 'decrypt', 'cipher', 'gcm', 'cbc', 'security'],
  icon: 'Lock',
  component: () => import('./Aes'),
};

export default tool;
