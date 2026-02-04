import { useState, useCallback } from 'react';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { RefreshCw } from 'lucide-react';

export default function UuidGenerator() {
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [uuids, setUuids] = useState<string[]>(() => [crypto.randomUUID()]);

  const generate = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => {
      let uuid: string = crypto.randomUUID();
      if (noDashes) uuid = uuid.replace(/-/g, '');
      if (uppercase) uuid = uuid.toUpperCase();
      return uuid;
    });
    setUuids(newUuids);
  }, [count, uppercase, noDashes]);

  const allText = uuids.join('\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">UUID Generator</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Generate random UUID v4 identifiers
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Options */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-muted">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-20 text-center"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded"
            />
            Uppercase
          </label>

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={noDashes}
              onChange={(e) => setNoDashes(e.target.checked)}
              className="rounded"
            />
            No dashes
          </label>

          <button
            onClick={generate}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <RefreshCw size={14} />
            Generate
          </button>
        </div>

        {/* Output */}
        <div className="rounded-lg border border-border bg-surface p-4 relative group">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={allText} />
          </div>
          <div className="space-y-1.5">
            {uuids.map((uuid, i) => (
              <div key={i} className="flex items-center gap-2">
                <code className="font-mono text-sm text-text-primary select-all">{uuid}</code>
                {uuids.length > 1 && <CopyButton text={uuid} size={14} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
