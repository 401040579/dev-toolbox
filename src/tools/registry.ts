import type { ToolDefinition, TransformDefinition, ToolCategory } from './types';

// Import tool definitions directly — no circular dependency since
// tool files no longer import from this module.
import base64Tool from './encoding/base64';
import epochTool from './time/epoch-converter';
import jsonFormatterTool from './json/json-formatter';
import uuidTool from './generators/uuid';
import hashTool from './generators/hash';

const ALL_TOOLS: ToolDefinition[] = [
  base64Tool,
  epochTool,
  jsonFormatterTool,
  uuidTool,
  hashTool,
];

const toolRegistry = new Map<string, ToolDefinition>();
const transformRegistry = new Map<string, TransformDefinition>();

for (const tool of ALL_TOOLS) {
  toolRegistry.set(tool.id, tool);
  if (tool.transforms) {
    for (const t of tool.transforms) {
      transformRegistry.set(t.id, t);
    }
  }
}

export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.get(id);
}

export function getToolList(): ToolDefinition[] {
  return Array.from(toolRegistry.values());
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getToolList().filter((t) => t.category === category);
}

export function getTransform(id: string): TransformDefinition | undefined {
  return transformRegistry.get(id);
}

export function getAllTransforms(): TransformDefinition[] {
  return Array.from(transformRegistry.values());
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return getToolList();
  return getToolList().filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}
