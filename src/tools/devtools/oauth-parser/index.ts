import type { ToolDefinition } from '@/tools/types';

export interface OAuthTokenInfo {
  raw: string;
  parts: number;
  header?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  isJwt: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  issuedAt?: string;
  issuer?: string;
  audience?: string;
  subject?: string;
  scopes?: string[];
}

function decodeBase64Url(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

export function parseOAuthToken(token: string): OAuthTokenInfo {
  const trimmed = token.trim();
  // Remove "Bearer " prefix if present
  const raw = trimmed.replace(/^Bearer\s+/i, '');
  const parts = raw.split('.');

  const info: OAuthTokenInfo = { raw, parts: parts.length, isJwt: parts.length === 3 };

  if (parts.length === 3) {
    try {
      info.header = JSON.parse(decodeBase64Url(parts[0]!));
    } catch {
      // not valid JSON
    }
    try {
      const payload = JSON.parse(decodeBase64Url(parts[1]!));
      info.payload = payload;

      if (payload.exp) {
        info.expiresAt = new Date(payload.exp * 1000).toISOString();
        info.isExpired = Date.now() > payload.exp * 1000;
      }
      if (payload.iat) info.issuedAt = new Date(payload.iat * 1000).toISOString();
      if (payload.iss) info.issuer = String(payload.iss);
      if (payload.aud) info.audience = String(payload.aud);
      if (payload.sub) info.subject = String(payload.sub);
      if (payload.scope) info.scopes = String(payload.scope).split(' ');
      if (payload.scp && Array.isArray(payload.scp)) info.scopes = payload.scp;
    } catch {
      // not valid JSON
    }
  }

  return info;
}

const tool: ToolDefinition = {
  id: 'oauth-parser',
  name: 'OAuth Token Parser',
  description: 'Parse and inspect OAuth/Bearer tokens',
  category: 'devtools',
  keywords: ['oauth', 'token', 'bearer', 'parse', 'inspect', 'jwt'],
  icon: 'Key',
  component: () => import('./OAuthParser'),
};

export default tool;
