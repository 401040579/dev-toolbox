import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'encode' | 'decode';

export default function Base64Tool() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        return { output: btoa(unescape(encodeURIComponent(input))), error: null };
      } else {
        return { output: decodeURIComponent(escape(atob(input.trim()))), error: null };
      }
    } catch {
      return {
        output: '',
        error: mode === 'encode' ? t('tools.base64.invalidInput') : t('tools.base64.invalidBase64'),
      };
    }
  }, [input, mode, t]);

  return (
    <ToolLayout
      toolId="base64"
      title={t('tools.base64.title')}
      description={t('tools.base64.description')}
      actions={
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setMode('encode')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'encode'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.base64.encode')}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'decode'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.base64.decode')}
          </button>
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? t('tools.base64.encodePlaceholder') : t('tools.base64.decodePlaceholder')}
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
              <pre className="font-mono text-sm whitespace-pre-wrap break-all pr-10">
                {output}
              </pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">{t('common.outputPlaceholder')}</p>
          )}
        </div>
      }
    />
  );
}
