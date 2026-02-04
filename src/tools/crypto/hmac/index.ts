import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'hmac-generator',
  name: 'HMAC Generator',
  description: 'Generate HMAC signatures using SHA-256, SHA-384, or SHA-512',
  category: 'crypto',
  keywords: ['hmac', 'hash', 'mac', 'signature', 'sha', 'authenticate', 'key'],
  icon: 'ShieldCheck',
  component: () => import('./HmacGenerator'),
};

export default tool;
