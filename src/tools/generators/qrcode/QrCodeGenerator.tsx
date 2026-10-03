import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import QRCode from 'qrcode';
import { downloadText } from '@/lib/download';

export default function QrCodeGenerator() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [size, setSize] = useState(256);

  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setSvg('');
    setError('');
    if (input.trim()) {
      QRCode.toString(input, { type: 'svg', width: size, margin: 4, errorCorrectionLevel: 'M' })
        .then((value) => { if (active) setSvg(value); })
        .catch(() => { if (active) setError(t('tools.qrcode.tooLong')); });
    }
    return () => { active = false; };
  }, [input, size, t]);
  const qrUrl = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';
  const handleDownload = () => downloadText(svg, 'qrcode.svg', 'image/svg+xml');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.qrcode.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.qrcode.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.qrcode.contentLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.qrcode.placeholder')}
            className="w-full min-h-[80px] resize-y"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs font-medium text-text-muted">{t('tools.qrcode.sizeLabel')}</label>
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
              {t('tools.qrcode.downloadSvg')}
            </button>
          )}
        </div>

        {qrUrl && (
          <div className="flex justify-center">
            <div className="rounded-lg border border-border bg-white p-4">
              <img
                src={qrUrl}
                alt={t('tools.qrcode.imageAlt')}
                width={size}
                height={size}
                className="block"
              />
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-error text-sm">{error}</p>}

        {!input.trim() && (
          <p className="text-center text-text-muted text-sm">{t('tools.qrcode.emptyState')}</p>
        )}
      </div>
    </div>
  );
}
