import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { slugify } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function Slugify() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [strict, setStrict] = useState(true);

  const output = useMemo(() => {
    if (!input) return '';
    return slugify(input, { separator, lowercase, strict });
  }, [input, separator, lowercase, strict]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.slugify.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.slugify.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.slugify.inputLabel')}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.slugify.inputPlaceholder')}
            className="w-full"
          />
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.slugify.separatorLabel')}
            </label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-32"
            >
              <option value="-">{t('tools.slugify.sepDash')} (-)</option>
              <option value="_">{t('tools.slugify.sepUnderscore')} (_)</option>
              <option value=".">{t('tools.slugify.sepDot')} (.)</option>
              <option value="">{t('tools.slugify.sepNone')}</option>
            </select>
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.slugify.lowercase')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={strict}
                onChange={(e) => setStrict(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.slugify.strict')}</span>
            </label>
          </div>
        </div>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.slugify.outputLabel')}
              </label>
              <CopyButton text={output} />
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface font-mono text-sm">
              {output}
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.slugify.examples')}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Hello World!',
              'My Awesome Blog Post',
              'Café & Restaurant',
              '日本語 Title',
              '10 Tips for SEO',
            ].map((text) => (
              <button
                key={text}
                onClick={() => setInput(text)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
