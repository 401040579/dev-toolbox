import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseURL } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function UrlParser() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    return parseURL(input);
  }, [input]);

  const fields = [
    { key: 'href', label: t('tools.urlParser.href') },
    { key: 'protocol', label: t('tools.urlParser.protocol') },
    { key: 'hostname', label: t('tools.urlParser.hostname') },
    { key: 'port', label: t('tools.urlParser.port') },
    { key: 'pathname', label: t('tools.urlParser.pathname') },
    { key: 'search', label: t('tools.urlParser.search') },
    { key: 'hash', label: t('tools.urlParser.hash') },
    { key: 'origin', label: t('tools.urlParser.origin') },
    { key: 'username', label: t('tools.urlParser.username') },
    { key: 'password', label: t('tools.urlParser.password') },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.urlParser.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.urlParser.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.urlParser.inputLabel')}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.urlParser.inputPlaceholder')}
            className="w-full font-mono"
          />
        </div>

        {/* Error */}
        {input.trim() && !parsed && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10">
            <p className="text-sm text-error">{t('tools.urlParser.invalidUrl')}</p>
          </div>
        )}

        {/* Results */}
        {parsed && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {fields.map(({ key, label }) => {
                    const value = parsed[key];
                    if (!value) return null;
                    return (
                      <tr key={key}>
                        <td className="px-4 py-2 font-medium text-text-secondary w-32">{label}</td>
                        <td className="px-4 py-2 font-mono break-all">{value}</td>
                        <td className="px-4 py-2 w-12">
                          <CopyButton text={value} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Query Parameters */}
            {Object.keys(parsed.searchParams).length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.urlParser.queryParams')}
                </h3>
                <div className="rounded-lg border border-border bg-surface overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-alt">
                      <tr>
                        <th className="px-4 py-2 text-left text-text-muted font-medium">Key</th>
                        <th className="px-4 py-2 text-left text-text-muted font-medium">Value</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.entries(parsed.searchParams).map(([key, values]) =>
                        values.map((value, i) => (
                          <tr key={`${key}-${i}`}>
                            <td className="px-4 py-2 font-mono text-text-secondary">{key}</td>
                            <td className="px-4 py-2 font-mono break-all">{value}</td>
                            <td className="px-4 py-2">
                              <CopyButton text={value} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Examples */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.urlParser.examples')}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'https://example.com:8080/path/to/page?query=value&foo=bar#section',
              'https://user:pass@api.example.com/v1/users?id=123',
              'file:///home/user/document.pdf',
            ].map((url) => (
              <button
                key={url}
                onClick={() => setInput(url)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded font-mono truncate max-w-xs"
              >
                {url}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
