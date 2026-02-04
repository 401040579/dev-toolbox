import { useState, useEffect } from 'react';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Algorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';
const ALGORITHMS: Algorithm[] = ['SHA-256', 'SHA-384', 'SHA-512'];

async function computeHmac(message: string, key: string, algorithm: Algorithm): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function HmacGenerator() {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!message || !key) {
      setResult('');
      setError(null);
      return;
    }

    let cancelled = false;
    computeHmac(message, key, algorithm)
      .then((hash) => {
        if (!cancelled) {
          setResult(hash);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setResult('');
          setError((e as Error).message);
        }
      });

    return () => { cancelled = true; };
  }, [message, key, algorithm]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">HMAC Generator</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Generate HMAC signatures using Web Crypto API
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Algorithm
          </label>
          <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
            {ALGORITHMS.map((algo) => (
              <button
                key={algo}
                onClick={() => setAlgorithm(algo)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  algorithm === algo
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {algo}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Secret Key
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter secret key..."
            className="w-full max-w-lg"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to sign..."
            className="w-full min-h-[100px] resize-y"
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-error text-sm">{error}</p>
        )}

        {result && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                HMAC-{algorithm}
              </span>
              <CopyButton text={result} size={14} />
            </div>
            <code className="font-mono text-sm text-text-primary break-all select-all">{result}</code>
          </div>
        )}
      </div>
    </div>
  );
}
