import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { decodeSaml } from './index';

export default function SamlDecoder() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const info = input.trim() ? decodeSaml(input) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.samlDecoder.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.samlDecoder.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.samlDecoder.input')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.samlDecoder.placeholder')}
            className="w-full h-32 resize-none font-mono text-xs"
          />
        </div>

        {info && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {info.issuer && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">{t('tools.samlDecoder.issuer')}</p>
                  <p className="text-sm font-mono text-text-primary break-all">{info.issuer}</p>
                </div>
              )}
              {info.nameId && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">{t('tools.samlDecoder.nameId')}</p>
                  <p className="text-sm font-mono text-text-primary">{info.nameId}</p>
                </div>
              )}
              {info.sessionIndex && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">{t('tools.samlDecoder.sessionIndex')}</p>
                  <p className="text-sm font-mono text-text-primary">{info.sessionIndex}</p>
                </div>
              )}
              {info.conditions && (
                <div className="p-2 rounded bg-surface-alt">
                  <p className="text-xs text-text-muted">{t('tools.samlDecoder.conditions')}</p>
                  <p className="text-xs font-mono text-text-primary">
                    {info.conditions.notBefore && `Not Before: ${info.conditions.notBefore}`}
                    {info.conditions.notOnOrAfter && ` | Not After: ${info.conditions.notOnOrAfter}`}
                  </p>
                </div>
              )}
            </div>

            {info.attributes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.samlDecoder.attributes')} ({info.attributes.length})
                </label>
                <div className="space-y-1">
                  {info.attributes.map((attr, i) => (
                    <div key={i} className="flex gap-2 p-2 rounded bg-surface-alt">
                      <span className="text-xs font-medium text-text-muted min-w-24">{attr.name}</span>
                      <span className="text-xs font-mono text-text-primary">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.samlDecoder.decodedXml')}
              </label>
              <textarea
                readOnly
                value={info.xml}
                className="w-full h-48 resize-none font-mono text-xs bg-surface"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
