import { useState, useEffect } from 'react';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

const ALGORITHMS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];

async function computeHash(input: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<Algorithm, string>>({
    'SHA-1': '',
    'SHA-256': '',
    'SHA-512': '',
  });

  useEffect(() => {
    if (!input) {
      setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' });
      return;
    }

    let cancelled = false;
    Promise.all(
      ALGORITHMS.map(async (algo) => {
        const hash = await computeHash(input, algo);
        return [algo, hash] as const;
      }),
    ).then((results) => {
      if (cancelled) return;
      const newHashes = {} as Record<Algorithm, string>;
      for (const [algo, hash] of results) {
        newHashes[algo] = hash;
      }
      setHashes(newHashes);
    });

    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Hash Generator</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Generate SHA-1, SHA-256, and SHA-512 hashes using Web Crypto API
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Input Text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full min-h-[120px] resize-y"
            spellCheck={false}
          />
        </div>

        {/* Hashes */}
        <div className="space-y-3">
          {ALGORITHMS.map((algo) => (
            <div key={algo} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {algo}
                </span>
                {hashes[algo] && <CopyButton text={hashes[algo]} size={14} />}
              </div>
              <code className="font-mono text-sm text-text-primary break-all select-all">
                {hashes[algo] || '—'}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
