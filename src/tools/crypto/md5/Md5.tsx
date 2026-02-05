import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { md5 } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function Md5() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [uppercase, setUppercase] = useState(false);

  const hash = useMemo(() => {
    if (!input) return '';
    const result = md5(input);
    return uppercase ? result.toUpperCase() : result;
  }, [input, uppercase]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.md5.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.md5.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Warning */}
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
          <p className="text-sm text-warning">{t('tools.md5.warning')}</p>
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.md5.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.md5.inputPlaceholder')}
            className="w-full h-32 font-mono resize-none"
          />
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary">{t('tools.md5.uppercase')}</span>
          </label>
        </div>

        {/* Output */}
        {hash && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.md5.outputLabel')}
              </label>
              <CopyButton text={hash} />
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface font-mono text-sm break-all">
              {hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
