import type { ToolDefinition } from '@/tools/types';

export type JwtAlgorithm = 'HS256' | 'HS384' | 'HS512';

export interface JwtHeader {
  alg: JwtAlgorithm;
  typ: string;
}

export interface JwtPayload {
  [key: string]: unknown;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(message: string, secret: string, algorithm: JwtAlgorithm): Promise<string> {
  const algMap: Record<JwtAlgorithm, string> = {
    HS256: 'SHA-256',
    HS384: 'SHA-384',
    HS512: 'SHA-512',
  };

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: algMap[algorithm] },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(signature);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateJwt(
  payload: JwtPayload,
  secret: string,
  algorithm: JwtAlgorithm = 'HS256'
): Promise<string> {
  const header: JwtHeader = { alg: algorithm, typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;
  const signature = await hmacSign(message, secret, algorithm);
  return `${message}.${signature}`;
}

const tool: ToolDefinition = {
  id: 'jwt-generator',
  name: 'JWT Generator',
  description: 'Generate JSON Web Tokens with custom claims',
  category: 'devtools',
  keywords: ['jwt', 'token', 'generate', 'json', 'web', 'auth'],
  icon: 'Key',
  component: () => import('./JwtGenerator'),
};

export default tool;
