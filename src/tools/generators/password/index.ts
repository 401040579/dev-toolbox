import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'password-generator',
  name: 'Password Generator',
  description: 'Generate secure random passwords with customizable rules',
  category: 'generators',
  keywords: ['password', 'generate', 'random', 'secure', 'passphrase'],
  icon: 'Lock',
  component: () => import('./PasswordGenerator'),
};

export default tool;
