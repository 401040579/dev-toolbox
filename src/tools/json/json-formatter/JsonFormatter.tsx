import { useState, useMemo } from 'react';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type IndentType = '2' | '4' | 'tab';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<IndentType>('2');

  const { output, error, stats } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null, stats: null };
    try {
      const parsed = JSON.parse(input);
      const indentValue = indent === 'tab' ? '\t' : Number(indent);
      const formatted = JSON.stringify(parsed, null, indentValue);
      const minified = JSON.stringify(parsed);
      return {
        output: formatted,
        error: null,
        stats: {
          keys: countKeys(parsed),
          minifiedSize: new Blob([minified]).size,
          formattedSize: new Blob([formatted]).size,
        },
      };
    } catch (e) {
      return { output: '', error: (e as Error).message, stats: null };
    }
  }, [input, indent]);

  return (
    <ToolLayout
      title="JSON Formatter"
      description="Format, minify, and validate JSON data"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as IndentType)}
            className="px-2 py-1 text-xs rounded-md border border-border bg-surface text-text-secondary"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
          {input.trim() && !error && (
            <button
              onClick={() => {
                try {
                  setInput(JSON.stringify(JSON.parse(input)));
                } catch { /* noop */ }
              }}
              className="px-3 py-1 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
            >
              Minify
            </button>
          )}
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Paste JSON here...\n\n{"key": "value"}'
          className="w-full h-full min-h-[200px] resize-none bg-transparent font-mono text-sm outline-none"
          spellCheck={false}
        />
      }
      output={
        <div className="relative h-full">
          {error ? (
            <div className="space-y-2">
              <p className="text-error text-sm font-medium">Invalid JSON</p>
              <p className="text-error/80 text-xs font-mono">{error}</p>
            </div>
          ) : output ? (
            <>
              <div className="absolute right-0 top-0 flex items-center gap-1">
                <CopyButton text={output} />
              </div>
              {stats && (
                <div className="flex items-center gap-4 mb-3 text-xs text-text-muted">
                  <span>{stats.keys} keys</span>
                  <span>{formatBytes(stats.minifiedSize)} minified</span>
                </div>
              )}
              <pre className="font-mono text-sm whitespace-pre overflow-x-auto pr-10">
                {output}
              </pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">Formatted JSON will appear here</p>
          )}
        </div>
      }
    />
  );
}

function countKeys(obj: unknown): number {
  if (typeof obj !== 'object' || obj === null) return 0;
  if (Array.isArray(obj)) return obj.reduce((sum: number, item) => sum + countKeys(item), 0);
  return Object.keys(obj).length + Object.values(obj).reduce((sum: number, val) => sum + countKeys(val), 0);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
