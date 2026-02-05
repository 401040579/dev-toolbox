import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'encode' | 'decode';

const encodeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export default function HtmlEntity() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [encodeAll, setEncodeAll] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        if (encodeAll) {
          const encoded = Array.from(input)
            .map((char) => {
              const code = char.charCodeAt(0);
              if (code > 127 || encodeMap[char]) {
                return `&#${code};`;
              }
              return char;
            })
            .join('');
          return { output: encoded, error: null };
        }
        return {
          output: input.replace(/[&<>"'`=/]/g, (char) => encodeMap[char] || char),
          error: null,
        };
      } else {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = input;
        return { output: textarea.value, error: null };
      }
    } catch {
      return { output: '', error: t('tools.htmlEntity.error') };
    }
  }, [input, mode, encodeAll, t]);

  return (
    <ToolLayout
      toolId="html-entity"
      title={t('tools.htmlEntity.title')}
      description={t('tools.htmlEntity.description')}
      actions={
        <div className="flex items-center gap-3">
          {mode === 'encode' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={encodeAll}
                onChange={(e) => setEncodeAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-text-secondary">{t('tools.htmlEntity.encodeAll')}</span>
            </label>
          )}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('encode')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'encode'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.htmlEntity.encode')}
            </button>
            <button
              onClick={() => setMode('decode')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'decode'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.htmlEntity.decode')}
            </button>
          </div>
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'encode'
              ? t('tools.htmlEntity.encodePlaceholder')
              : t('tools.htmlEntity.decodePlaceholder')
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
