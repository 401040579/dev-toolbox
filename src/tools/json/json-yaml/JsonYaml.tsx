import { useState, useMemo } from 'react';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { jsonToYaml } from './index';

type Mode = 'json-to-yaml' | 'yaml-to-json';

// Simple YAML-to-JSON parser for common cases
function yamlToJson(yaml: string): string {
  // Handle simple YAML by converting to JSON
  const lines = yaml.split('\n');
  const result: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    const content = trimmed.trim();

    // Pop stack to find parent
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]!.obj;

    if (content.includes(': ')) {
      const colonIdx = content.indexOf(': ');
      const key = content.slice(0, colonIdx).trim();
      const rawValue = content.slice(colonIdx + 2).trim();
      const value = parseYamlValue(rawValue);
      parent[key] = value;
      // Push a new level in case children follow
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        stack.push({ obj: value as Record<string, unknown>, indent });
      }
    } else if (content.endsWith(':')) {
      const key = content.slice(0, -1).trim();
      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ obj: child, indent });
    }
  }

  return JSON.stringify(result, null, 2);
}

function parseYamlValue(value: string): unknown {
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value.startsWith('[') && value.endsWith(']')) {
    try { return JSON.parse(value); } catch { return value; }
  }
  if (value.startsWith('{') && value.endsWith('}')) {
    try { return JSON.parse(value); } catch { return value; }
  }
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}

export default function JsonYaml() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('json-to-yaml');

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null };
    try {
      if (mode === 'json-to-yaml') {
        const parsed = JSON.parse(input);
        return { output: jsonToYaml(parsed, 0), error: null };
      } else {
        return { output: yamlToJson(input), error: null };
      }
    } catch (e) {
      return { output: '', error: (e as Error).message };
    }
  }, [input, mode]);

  return (
    <ToolLayout
      toolId="json-yaml"
      title="JSON ↔ YAML"
      description="Convert between JSON and YAML formats"
      actions={
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setMode('json-to-yaml')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'json-to-yaml'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            JSON → YAML
          </button>
          <button
            onClick={() => setMode('yaml-to-json')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'yaml-to-json'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            YAML → JSON
          </button>
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'json-to-yaml' ? 'Paste JSON here...' : 'Paste YAML here...'}
          className="w-full h-full min-h-[200px] resize-none bg-transparent font-mono text-sm outline-none"
          spellCheck={false}
        />
      }
      output={
        <div className="relative h-full">
          {error ? (
            <p className="text-error text-sm">{error}</p>
          ) : output ? (
            <>
              <div className="absolute right-0 top-0">
                <CopyButton text={output} />
              </div>
              <pre className="font-mono text-sm whitespace-pre overflow-x-auto pr-10">{output}</pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">Output will appear here</p>
          )}
        </div>
      }
    />
  );
}
