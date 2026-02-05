import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCSS, minifyCSS } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const SAMPLE_CSS = `.container{display:flex;flex-direction:column;gap:1rem}.button{background-color:#3b82f6;color:white;padding:0.5rem 1rem;border-radius:0.25rem}.button:hover{background-color:#2563eb}`;

export default function CssFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_CSS);
  const [indent, setIndent] = useState('  ');
  const [mode, setMode] = useState<'format' | 'minify'>('format');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return mode === 'format'
        ? formatCSS(input, { indent })
        : minifyCSS(input);
    } catch {
      return t('tools.cssFormatter.error');
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
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.cssFormatter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.cssFormatter.description')}</p>
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
              {t('tools.cssFormatter.format')}
            </button>
            <button
              onClick={() => setMode('minify')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'minify' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.cssFormatter.minify')}
            </button>
          </div>

          {mode === 'format' && (
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              className="text-sm"
            >
              <option value="  ">{t('tools.cssFormatter.twoSpaces')}</option>
              <option value="    ">{t('tools.cssFormatter.fourSpaces')}</option>
              <option value={'\t'}>{t('tools.cssFormatter.tab')}</option>
            </select>
          )}
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.cssFormatter.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.cssFormatter.inputPlaceholder')}
            className="w-full h-32 resize-none font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.cssFormatter.outputLabel')}
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
            <span>{t('tools.cssFormatter.inputSize')}: {stats.inputSize}</span>
            <span>{t('tools.cssFormatter.outputSize')}: {stats.outputSize}</span>
            {stats.reduction > 0 && (
              <span className="text-success">-{stats.reduction}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
