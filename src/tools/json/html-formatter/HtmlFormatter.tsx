import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatHTML, minifyHTML } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const SAMPLE_HTML = `<!DOCTYPE html><html><head><title>Page Title</title></head><body><div class="container"><h1>Hello World</h1><p>This is a paragraph.</p><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>`;

export default function HtmlFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_HTML);
  const [indent, setIndent] = useState('  ');
  const [mode, setMode] = useState<'format' | 'minify'>('format');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return mode === 'format'
        ? formatHTML(input, { indent })
        : minifyHTML(input);
    } catch {
      return t('tools.htmlFormatter.error');
    }
  }, [input, indent, mode, t]);

  const stats = useMemo(() => ({
    inputSize: input.length,
    outputSize: output.length,
    reduction: input.length > 0 ? Math.round((1 - output.length / input.length) * 100) : 0,
  }), [input, output]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.htmlFormatter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.htmlFormatter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('format')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'format' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.htmlFormatter.format')}
            </button>
            <button
              onClick={() => setMode('minify')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'minify' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.htmlFormatter.minify')}
            </button>
          </div>

          {mode === 'format' && (
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              className="text-sm"
            >
              <option value="  ">{t('tools.htmlFormatter.twoSpaces')}</option>
              <option value="    ">{t('tools.htmlFormatter.fourSpaces')}</option>
              <option value={'\t'}>{t('tools.htmlFormatter.tab')}</option>
            </select>
          )}
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.htmlFormatter.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.htmlFormatter.inputPlaceholder')}
            className="w-full h-32 resize-none font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.htmlFormatter.outputLabel')}
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            value={output}
            className="w-full h-48 resize-none font-mono text-sm bg-surface"
          />
        </div>

        {/* Stats */}
        {mode === 'minify' && input && (
          <div className="flex gap-4 text-sm text-text-secondary">
            <span>{t('tools.htmlFormatter.inputSize')}: {stats.inputSize}</span>
            <span>{t('tools.htmlFormatter.outputSize')}: {stats.outputSize}</span>
            {stats.reduction > 0 && (
              <span className="text-success">-{stats.reduction}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
