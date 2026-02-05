import type { ToolDefinition } from '@/tools/types';

export type KeyFormat = 'pkcs8' | 'spki' | 'jwk';
export type ModulusLength = 2048 | 3072 | 4096;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

function formatPEM(base64: string, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

export async function generateRSAKeyPair(
  modulusLength: ModulusLength = 2048,
  format: KeyFormat = 'pkcs8'
): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  if (format === 'jwk') {
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    return {
      publicKey: JSON.stringify(publicJwk, null, 2),
      privateKey: JSON.stringify(privateJwk, null, 2),
    };
  }

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: formatPEM(arrayBufferToBase64(publicKeyBuffer), 'PUBLIC KEY'),
    privateKey: formatPEM(arrayBufferToBase64(privateKeyBuffer), 'PRIVATE KEY'),
  };
}

const tool: ToolDefinition = {
  id: 'rsa-keygen',
  name: 'RSA Key Generator',
  description: 'Generate RSA public/private key pairs',
  category: 'crypto',
  keywords: ['rsa', 'key', 'keypair', 'public', 'private', 'generate', 'pem', 'pkcs8'],
  icon: 'KeyRound',
  component: () => import('./RsaKeygen'),
};

export default tool;
