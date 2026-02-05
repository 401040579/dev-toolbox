import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { escapeString, unescapeString, type EscapeFormat } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'escape' | 'unescape';

const FORMATS: { value: EscapeFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'url', label: 'URL' },
  { value: 'sql', label: 'SQL' },
  { value: 'csv', label: 'CSV' },
];

export default function StringEscape() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('escape');
  const [format, setFormat] = useState<EscapeFormat>('json');
  const [input, setInput] = useState('');

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'escape' ? escapeString(input, format) : unescapeString(input, format);
  }, [input, mode, format]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.stringEscape.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.stringEscape.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('escape')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'escape' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.stringEscape.escape')}
            </button>
            <button
              onClick={() => setMode('unescape')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'unescape' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.stringEscape.unescape')}
            </button>
          </div>

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as EscapeFormat)}
            className="w-40"
          >
            {FORMATS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.stringEscape.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.stringEscape.inputPlaceholder')}
            className="w-full h-32 font-mono text-sm resize-none"
          />
        </div>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.stringEscape.outputLabel')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-32 font-mono text-sm resize-none bg-surface"
            />
          </div>
        )}

        {/* Examples */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.stringEscape.examples')}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Hello "World"',
              "Line 1\nLine 2",
              '<script>alert("XSS")</script>',
              "It's a test",
            ].map((text, i) => (
              <button
                key={i}
                onClick={() => setInput(text)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded font-mono"
              >
                {text.replace(/\n/g, '\\n').slice(0, 20)}...
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
