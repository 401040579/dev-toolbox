import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseOAuthToken } from './index';

export default function OAuthParser() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const info = input.trim() ? parseOAuthToken(input) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.oauthParser.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.oauthParser.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.oauthParser.input')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.oauthParser.placeholder')}
            className="w-full h-24 resize-none font-mono text-xs"
          />
        </div>

        {info && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.isJwt ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                {info.isJwt ? 'JWT' : 'Opaque Token'}
              </span>
              {info.isExpired !== undefined && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.isExpired ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                  {info.isExpired ? t('tools.oauthParser.expired') : t('tools.oauthParser.valid')}
                </span>
              )}
            </div>

            {info.header && (
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.oauthParser.header')}
                </label>
                <pre className="p-3 rounded-lg bg-surface-alt text-xs font-mono text-text-primary overflow-x-auto">
                  {JSON.stringify(info.header, null, 2)}
                </pre>
              </div>
            )}

            {info.payload && (
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.oauthParser.payload')}
                </label>
                <pre className="p-3 rounded-lg bg-surface-alt text-xs font-mono text-text-primary overflow-x-auto">
                  {JSON.stringify(info.payload, null, 2)}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {info.issuer && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">Issuer</p>
                  <p className="text-sm font-mono text-text-primary">{info.issuer}</p>
                </div>
              )}
              {info.subject && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">Subject</p>
                  <p className="text-sm font-mono text-text-primary">{info.subject}</p>
                </div>
              )}
              {info.issuedAt && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">Issued At</p>
                  <p className="text-sm font-mono text-text-primary">{info.issuedAt}</p>
                </div>
              )}
              {info.expiresAt && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">Expires At</p>
                  <p className="text-sm font-mono text-text-primary">{info.expiresAt}</p>
                </div>
              )}
              {info.scopes && (
                <div className="p-2 rounded bg-surface-alt col-span-2">
                  <p className="text-xs text-text-muted">Scopes</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {info.scopes.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-accent-muted text-accent text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
