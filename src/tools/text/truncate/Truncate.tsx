import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { truncateText, truncateMiddle } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type TruncateMode = 'end' | 'middle';

export default function Truncate() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<TruncateMode>('end');
  const [length, setLength] = useState(100);
  const [ending, setEnding] = useState('...');
  const [preserveWords, setPreserveWords] = useState(true);

  const output = useMemo(() => {
    if (!input) return '';
    if (mode === 'middle') {
      return truncateMiddle(input, length, ending);
    }
    return truncateText(input, { length, ending, preserveWords });
  }, [input, mode, length, ending, preserveWords]);

  const stats = useMemo(() => ({
    original: input.length,
    truncated: output.length,
    removed: Math.max(0, input.length - output.length),
  }), [input, output]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.truncate.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.truncate.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.truncate.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.truncate.inputPlaceholder')}
            className="w-full h-32 resize-none"
          />
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.truncate.modeLabel')}
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as TruncateMode)}
              className="w-40"
            >
              <option value="end">{t('tools.truncate.modeEnd')}</option>
              <option value="middle">{t('tools.truncate.modeMiddle')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.truncate.lengthLabel')}
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-24"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.truncate.endingLabel')}
            </label>
            <input
              type="text"
              value={ending}
              onChange={(e) => setEnding(e.target.value)}
              className="w-20 font-mono"
            />
          </div>
        </div>

        {mode === 'end' && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveWords}
                onChange={(e) => setPreserveWords(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.truncate.preserveWords')}</span>
            </label>
          </div>
        )}

        {/* Quick Length Presets */}
        <div className="flex flex-wrap gap-2">
          {[50, 100, 150, 200, 280, 500].map((len) => (
            <button
              key={len}
              onClick={() => setLength(len)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                length === len
                  ? 'bg-accent-muted text-accent'
                  : 'bg-surface-alt hover:bg-border text-text-secondary'
              }`}
            >
              {len}
            </button>
          ))}
        </div>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.truncate.outputLabel')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-24 resize-none bg-surface"
            />
          </div>
        )}

        {/* Stats */}
        {input && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-surface-alt text-center">
              <p className="text-lg font-semibold">{stats.original}</p>
              <p className="text-xs text-text-muted">{t('tools.truncate.original')}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-alt text-center">
              <p className="text-lg font-semibold text-accent">{stats.truncated}</p>
              <p className="text-xs text-text-muted">{t('tools.truncate.result')}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-alt text-center">
              <p className="text-lg font-semibold text-error">{stats.removed}</p>
              <p className="text-xs text-text-muted">{t('tools.truncate.removed')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
