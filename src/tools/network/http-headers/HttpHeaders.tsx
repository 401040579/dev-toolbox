import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseHeaders } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function HttpHeaders() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const headers = useMemo(() => {
    if (!input.trim()) return [];
    return parseHeaders(input);
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.httpHeaders.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.httpHeaders.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.httpHeaders.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.httpHeaders.inputPlaceholder')}
            className="w-full h-40 font-mono text-sm resize-none"
          />
        </div>

        {/* Parsed Headers */}
        {headers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.httpHeaders.outputLabel')} ({headers.length})
              </label>
            </div>
            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-alt">
                  <tr>
                    <th className="px-4 py-2 text-left text-text-muted font-medium w-48">{t('tools.httpHeaders.headerName')}</th>
                    <th className="px-4 py-2 text-left text-text-muted font-medium">{t('tools.httpHeaders.headerValue')}</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {headers.map((header, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">
                        <span className="font-mono text-accent">{header.name}</span>
                        {header.description && (
                          <p className="text-xs text-text-muted mt-0.5">{header.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs break-all">{header.value}</td>
                      <td className="px-4 py-2">
                        <CopyButton text={header.value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sample Headers */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.httpHeaders.samples')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInput(`Host: example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0
Accept: text/html,application/xhtml+xml
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: session=abc123
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9`)}
              className="px-3 py-1.5 text-xs bg-surface-alt hover:bg-border rounded"
            >
              {t('tools.httpHeaders.sampleRequest')}
            </button>
            <button
              onClick={() => setInput(`HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 1234
Cache-Control: max-age=3600
ETag: "abc123"
Last-Modified: Mon, 01 Jan 2024 00:00:00 GMT
Access-Control-Allow-Origin: *
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
Set-Cookie: session=xyz789; HttpOnly; Secure`)}
              className="px-3 py-1.5 text-xs bg-surface-alt hover:bg-border rounded"
            >
              {t('tools.httpHeaders.sampleResponse')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
