import type { ComponentType } from 'react';

export type ToolCategory = 'time' | 'encoding' | 'text' | 'json' | 'generators' | 'crypto' | 'network' | 'image' | 'color';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: string;
  component: () => Promise<{ default: ComponentType }>;
  transforms?: TransformDefinition[];
}

export interface TransformDefinition {
  id: string;
  name: string;
  description: string;
  inputType: 'string' | 'bytes';
  outputType: 'string' | 'bytes';
  transform: (input: string, options?: Record<string, unknown>) => string | Promise<string>;
  options?: TransformOptionDef[];
}

export interface TransformOptionDef {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'select';
  default: unknown;
  choices?: { label: string; value: string }[];
}
