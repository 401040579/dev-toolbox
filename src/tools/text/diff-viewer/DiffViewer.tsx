import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  text: string;
  lineNum: { left?: number; right?: number };
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: DiffLine[] = [];

  const m = linesA.length;
  const n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  let i = m, j = n;
  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      stack.push({ type: 'equal', text: linesA[i - 1]!, lineNum: { left: i, right: j } });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      stack.push({ type: 'added', text: linesB[j - 1]!, lineNum: { right: j } });
      j--;
    } else {
      stack.push({ type: 'removed', text: linesA[i - 1]!, lineNum: { left: i } });
      i--;
    }
  }

  stack.reverse().forEach((l) => result.push(l));
  return result;
}

const WORKER_THRESHOLD = 5000; // characters

export default function DiffViewer() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [workerDiff, setWorkerDiff] = useState<DiffLine[] | null>(null);
  const [workerLoading, setWorkerLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const isLargeInput = left.length + right.length > WORKER_THRESHOLD;

  // Inline computation for small inputs
  const inlineDiff = useMemo(() => {
    if (isLargeInput) return [];
    if (!left && !right) return [];
    return computeDiff(left, right);
  }, [left, right, isLargeInput]);

  // Worker computation for large inputs
  useEffect(() => {
    if (!isLargeInput) {
      setWorkerDiff(null);
      return;
    }
    if (!left && !right) {
      setWorkerDiff([]);
      return;
    }

    setWorkerLoading(true);

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('@/workers/diff.worker.ts', import.meta.url),
        { type: 'module' },
      );
    }

    const worker = workerRef.current;
    const handler = (e: MessageEvent) => {
      if (e.data.result) {
        setWorkerDiff(e.data.result);
      }
      setWorkerLoading(false);
    };

    worker.addEventListener('message', handler);
    worker.postMessage({ left, right });

    return () => {
      worker.removeEventListener('message', handler);
    };
  }, [left, right, isLargeInput]);

  // Cleanup worker on unmount
  const cleanup = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);
  useEffect(() => cleanup, [cleanup]);

  const diff = isLargeInput ? (workerDiff ?? []) : inlineDiff;

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === 'added').length;
    const removed = diff.filter((d) => d.type === 'removed').length;
    return { added, removed };
  }, [diff]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Diff Viewer</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Compare two texts and see differences
        </p>
      </div>

      {/* Input panels */}
      <div className="flex flex-col md:flex-row border-b border-border">
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-border">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            Original
          </div>
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Paste original text..."
            className="flex-1 p-4 resize-none bg-transparent font-mono text-sm outline-none min-h-[120px]"
            spellCheck={false}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            Modified
          </div>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Paste modified text..."
            className="flex-1 p-4 resize-none bg-transparent font-mono text-sm outline-none min-h-[120px]"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Diff output */}
      <div className="flex-1 min-h-0 flex flex-col">
        {(diff.length > 0 || workerLoading) && (
          <div className="px-4 py-2 text-xs text-text-muted border-b border-border flex items-center gap-4">
            {workerLoading ? (
              <span className="text-accent">Computing diff…</span>
            ) : (
              <>
                <span className="text-success">+{stats.added} added</span>
                <span className="text-error">-{stats.removed} removed</span>
              </>
            )}
          </div>
        )}
        <div className="flex-1 overflow-auto font-mono text-sm">
          {diff.map((line, i) => (
            <div
              key={i}
              className={`flex px-4 py-0.5 ${
                line.type === 'added'
                  ? 'bg-success/10 text-success'
                  : line.type === 'removed'
                    ? 'bg-error/10 text-error'
                    : 'text-text-primary'
              }`}
            >
              <span className="w-8 text-right pr-2 text-text-muted select-none shrink-0">
                {line.lineNum.left ?? ''}
              </span>
              <span className="w-8 text-right pr-2 text-text-muted select-none shrink-0">
                {line.lineNum.right ?? ''}
              </span>
              <span className="w-4 text-center select-none shrink-0">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="flex-1 whitespace-pre">{line.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
