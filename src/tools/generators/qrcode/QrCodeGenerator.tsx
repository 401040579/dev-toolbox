import { useState, useMemo, useCallback } from 'react';

// Minimal QR code via Google Charts API (no external lib needed)
function getQrUrl(text: string, size: number): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg`;
}

export default function QrCodeGenerator() {
  const [input, setInput] = useState('');
  const [size, setSize] = useState(256);

  const qrUrl = useMemo(() => {
    if (!input.trim()) return '';
    return getQrUrl(input, size);
  }, [input, size]);

  const handleDownload = useCallback(async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(qrUrl, '_blank');
    }
  }, [qrUrl]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">QR Code Generator</h1>
        <p className="text-sm text-text-secondary mt-0.5">Generate QR codes from text or URLs</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Content
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text or URL..."
            className="w-full min-h-[80px] resize-y"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-text-muted">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-md border border-border bg-surface text-text-secondary"
          >
            <option value={128}>128px</option>
            <option value={256}>256px</option>
            <option value={512}>512px</option>
          </select>
          {qrUrl && (
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-background hover:bg-accent-hover transition-colors"
            >
              Download SVG
            </button>
          )}
        </div>

        {qrUrl && (
          <div className="flex justify-center">
            <div className="rounded-lg border border-border bg-white p-4">
              <img
                src={qrUrl}
                alt="QR Code"
                width={size}
                height={size}
                className="block"
              />
            </div>
          </div>
        )}

        {!input.trim() && (
          <p className="text-center text-text-muted text-sm">Enter text above to generate a QR code</p>
        )}
      </div>
    </div>
  );
}
