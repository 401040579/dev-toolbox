import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'escape' | 'unescape';

export default function UnicodeEscape() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('escape');
  const [escapeAll, setEscapeAll] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'escape') {
        const escaped = Array.from(input)
          .map((char) => {
            const code = char.charCodeAt(0);
            if (escapeAll || code > 127) {
              return `\\u${code.toString(16).padStart(4, '0')}`;
            }
            return char;
          })
          .join('');
        return { output: escaped, error: null };
      } else {
        const unescaped = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
        return { output: unescaped, error: null };
      }
    } catch {
      return { output: '', error: t('tools.unicodeEscape.error') };
    }
  }, [input, mode, escapeAll, t]);

  return (
    <ToolLayout
      toolId="unicode-escape"
      title={t('tools.unicodeEscape.title')}
      description={t('tools.unicodeEscape.description')}
      actions={
        <div className="flex items-center gap-3">
          {mode === 'escape' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={escapeAll}
                onChange={(e) => setEscapeAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-text-secondary">{t('tools.unicodeEscape.escapeAll')}</span>
            </label>
          )}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('escape')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'escape'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.unicodeEscape.escape')}
            </button>
            <button
              onClick={() => setMode('unescape')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'unescape'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.unicodeEscape.unescape')}
            </button>
          </div>
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'escape'
              ? t('tools.unicodeEscape.escapePlaceholder')
              : t('tools.unicodeEscape.unescapePlaceholder')
          }
          className="w-full h-full min-h-[200px] resize-none bg-transparent font-mono text-sm outline-none"
          spellCheck={false}
        />
      }
      output={
        <div className="relative h-full">
          {error ? (
            <p className="text-error text-sm">{error}</p>
          ) : output ? (
            <>
              <div className="absolute right-0 top-0">
                <CopyButton text={output} />
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap break-all pr-10">{output}</pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">{t('common.outputPlaceholder')}</p>
          )}
        </div>
      }
    />
  );
}
