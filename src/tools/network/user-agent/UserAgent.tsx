import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { parseUserAgent } from './index';

export default function UserAgent() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  useEffect(() => {
    setInput(navigator.userAgent);
  }, []);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return parseUserAgent(input);
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.userAgent.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.userAgent.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.userAgent.inputLabel')}
            </label>
            <button
              onClick={() => setInput(navigator.userAgent)}
              className="text-xs text-accent hover:text-accent/80"
            >
              {t('tools.userAgent.useMyUa')}
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.userAgent.inputPlaceholder')}
            className="w-full h-20 font-mono text-sm resize-none"
          />
        </div>

        {/* Results */}
        {result && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Browser */}
            {result.browser && (
              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌐</span>
                  <h3 className="text-sm font-medium text-text-muted">{t('tools.userAgent.browser')}</h3>
                </div>
                <p className="text-lg font-semibold">{result.browser.name}</p>
                {result.browser.version && (
                  <p className="text-sm text-text-muted">Version {result.browser.version}</p>
                )}
              </div>
            )}

            {/* OS */}
            {result.os && (
              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💻</span>
                  <h3 className="text-sm font-medium text-text-muted">{t('tools.userAgent.os')}</h3>
                </div>
                <p className="text-lg font-semibold">{result.os.name}</p>
                {result.os.version && (
                  <p className="text-sm text-text-muted">Version {result.os.version}</p>
                )}
              </div>
            )}

            {/* Device */}
            {result.device && (
              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-sm font-medium text-text-muted">{t('tools.userAgent.device')}</h3>
                </div>
                <p className="text-lg font-semibold">{result.device.type}</p>
                {result.device.vendor && (
                  <p className="text-sm text-text-muted">{result.device.vendor} {result.device.model}</p>
                )}
              </div>
            )}

            {/* Engine */}
            {result.engine && (
              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚙️</span>
                  <h3 className="text-sm font-medium text-text-muted">{t('tools.userAgent.engine')}</h3>
                </div>
                <p className="text-lg font-semibold">{result.engine.name}</p>
                {result.engine.version && (
                  <p className="text-sm text-text-muted">Version {result.engine.version}</p>
                )}
              </div>
            )}

            {/* CPU */}
            {result.cpu && (
              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🖥️</span>
                  <h3 className="text-sm font-medium text-text-muted">{t('tools.userAgent.cpu')}</h3>
                </div>
                <p className="text-lg font-semibold">{result.cpu.architecture}</p>
              </div>
            )}
          </div>
        )}

        {/* Sample User Agents */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.userAgent.samples')}
          </p>
          <div className="space-y-2">
            {[
              { label: 'Chrome on Windows', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
              { label: 'Safari on macOS', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
              { label: 'Firefox on Linux', ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0' },
              { label: 'Safari on iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
              { label: 'Chrome on Android', ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' },
            ].map(({ label, ua }) => (
              <button
                key={label}
                onClick={() => setInput(ua)}
                className="w-full text-left px-3 py-2 text-sm bg-surface-alt hover:bg-border rounded transition-colors"
              >
                <p className="font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-muted truncate">{ua}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
