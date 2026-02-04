import { useState, useMemo } from 'react';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Operation = 'sort' | 'sort-desc' | 'unique' | 'reverse' | 'shuffle' | 'trim' | 'number' | 'remove-empty';

const OPERATIONS: { id: Operation; label: string }[] = [
  { id: 'sort', label: 'Sort A→Z' },
  { id: 'sort-desc', label: 'Sort Z→A' },
  { id: 'unique', label: 'Unique' },
  { id: 'reverse', label: 'Reverse' },
  { id: 'shuffle', label: 'Shuffle' },
  { id: 'trim', label: 'Trim' },
  { id: 'remove-empty', label: 'Remove empty' },
  { id: 'number', label: 'Number lines' },
];

function applyOperation(input: string, op: Operation): string {
  const lines = input.split('\n');
  switch (op) {
    case 'sort': return lines.sort((a, b) => a.localeCompare(b)).join('\n');
    case 'sort-desc': return lines.sort((a, b) => b.localeCompare(a)).join('\n');
    case 'unique': return [...new Set(lines)].join('\n');
    case 'reverse': return lines.reverse().join('\n');
    case 'shuffle': return lines.sort(() => Math.random() - 0.5).join('\n');
    case 'trim': return lines.map((l) => l.trim()).join('\n');
    case 'remove-empty': return lines.filter((l) => l.trim() !== '').join('\n');
    case 'number': return lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
  }
}

export default function LineTools() {
  const [input, setInput] = useState('');
  const [operation, setOperation] = useState<Operation>('sort');
  // Use a key to force re-computation on shuffle
  const [shuffleKey, setShuffleKey] = useState(0);

  const output = useMemo(() => {
    if (!input) return '';
    void shuffleKey; // dependency for shuffle recalculation
    return applyOperation(input, operation);
  }, [input, operation, shuffleKey]);

  const stats = useMemo(() => {
    if (!input) return null;
    const lines = input.split('\n');
    return {
      lines: lines.length,
      unique: new Set(lines).size,
      chars: input.length,
    };
  }, [input]);

  return (
    <ToolLayout
      toolId="line-tools"
      title="Line Tools"
      description="Sort, deduplicate, reverse, and manipulate lines"
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              onClick={() => {
                setOperation(op.id);
                if (op.id === 'shuffle') setShuffleKey((k) => k + 1);
              }}
              className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                operation === op.id
                  ? 'border-accent text-accent bg-accent-muted'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      }
      input={
        <>
          {stats && (
            <div className="flex items-center gap-4 mb-2 text-xs text-text-muted">
              <span>{stats.lines} lines</span>
              <span>{stats.unique} unique</span>
              <span>{stats.chars} chars</span>
            </div>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter lines of text..."
            className="w-full h-full min-h-[200px] resize-none bg-transparent font-mono text-sm outline-none"
            spellCheck={false}
          />
        </>
      }
      output={
        <div className="relative h-full">
          {output ? (
            <>
              <div className="absolute right-0 top-0">
                <CopyButton text={output} />
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap pr-10">{output}</pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">Output will appear here</p>
          )}
        </div>
      }
    />
  );
}
