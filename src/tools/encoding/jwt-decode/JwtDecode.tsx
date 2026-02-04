import { useState, useMemo } from 'react';
import { CopyButton } from '@/components/copy-button/CopyButton';

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
}

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export default function JwtDecode() {
  const [input, setInput] = useState('');

  const result = useMemo((): { decoded: DecodedJwt; error: null } | { decoded: null; error: string } | null => {
    const token = input.trim();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { decoded: null, error: 'Invalid JWT: expected 3 parts separated by dots' };

      const header = JSON.parse(decodeBase64Url(parts[0]!));
      const payload = JSON.parse(decodeBase64Url(parts[1]!));
      const signature = parts[2]!;

      return { decoded: { header, payload, signature }, error: null };
    } catch (e) {
      return { decoded: null, error: (e as Error).message };
    }
  }, [input]);

  const expInfo = useMemo(() => {
    if (!result?.decoded) return null;
    const exp = result.decoded.payload['exp'];
    if (typeof exp !== 'number') return null;
    const expDate = new Date(exp * 1000);
    const isExpired = expDate.getTime() < Date.now();
    return { date: expDate.toISOString(), isExpired };
  }, [result]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">JWT Decode</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Decode and inspect JSON Web Tokens (no verification)
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            JWT Token
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste JWT token here (eyJhbGciOiJ...)"
            className="w-full min-h-[100px] resize-y"
            spellCheck={false}
          />
        </div>

        {result && (
          result.error ? (
            <div className="rounded-lg border border-error/30 bg-surface p-4">
              <p className="text-error text-sm">{result.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Expiration badge */}
              {expInfo && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${
                  expInfo.isExpired
                    ? 'bg-error/10 text-error border border-error/20'
                    : 'bg-success/10 text-success border border-success/20'
                }`}>
                  {expInfo.isExpired ? 'Expired' : 'Valid'} — {expInfo.date}
                </div>
              )}

              {result.decoded && (
                <>
                  {/* Header */}
                  <Section title="Header" data={result.decoded.header} />

                  {/* Payload */}
                  <Section title="Payload" data={result.decoded.payload} />

                  {/* Signature */}
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Signature</span>
                      <CopyButton text={result.decoded.signature} size={14} />
                    </div>
                    <code className="font-mono text-xs text-text-secondary break-all">{result.decoded.signature}</code>
                  </div>
                </>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Section({ title, data }: { title: string; data: Record<string, unknown> }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</span>
        <CopyButton text={json} size={14} />
      </div>
      <pre className="font-mono text-sm text-text-primary whitespace-pre overflow-x-auto">{json}</pre>
    </div>
  );
}
