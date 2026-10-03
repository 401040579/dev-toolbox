import type { ToolDefinition } from '@/tools/types';

const tool: ToolDefinition = {
  id: 'toml-converter',
  name: 'TOML Converter',
  description: 'Convert between TOML, JSON, and YAML',
  category: 'json',
  keywords: ['toml', 'json', 'yaml', 'convert', 'config', 'configuration'],
  icon: 'FileJson',
  component: () => import('./TomlConverter'),
};

export default tool;
