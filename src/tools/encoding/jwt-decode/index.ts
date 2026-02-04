import type { ToolDefinition } from '@/tools/types';

function decodeJwt(token: string): string {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT: expected 3 parts separated by dots');

  const decodeBase64Url = (str: string) => {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  };

  const header = JSON.parse(decodeBase64Url(parts[0]!));
  const payload = JSON.parse(decodeBase64Url(parts[1]!));

  return JSON.stringify({ header, payload }, null, 2);
}

const tool: ToolDefinition = {
  id: 'jwt-decode',
  name: 'JWT Decode',
  description: 'Decode and inspect JSON Web Tokens without verification',
  category: 'encoding',
  keywords: ['jwt', 'json', 'web', 'token', 'decode', 'bearer', 'auth'],
  icon: 'KeyRound',
  component: () => import('./JwtDecode'),
  transforms: [
    {
      id: 'jwt-decode',
      name: 'JWT Decode',
      description: 'Decode JWT header and payload',
      inputType: 'string',
      outputType: 'string',
      transform: decodeJwt,
    },
  ],
};

export default tool;
