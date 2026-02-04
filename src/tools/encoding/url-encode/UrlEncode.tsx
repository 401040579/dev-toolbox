import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'encode' | 'decode';

export default function UrlEncode() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [fullUrl, setFullUrl] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        return {
          output: fullUrl ? encodeURI(input) : encodeURIComponent(input),
          error: null,
        };
      } else {
        return {
          output: fullUrl ? decodeURI(input.trim()) : decodeURIComponent(input.trim()),
          error: null,
        };
      }
    } catch {
      return { output: '', error: t('tools.base64.invalidInput') };
    }
  }, [input, mode, fullUrl, t]);

  return (
    <ToolLayout
      toolId="url-encode"
      title={t('tools.urlEncode.title')}
      description={t('tools.urlEncode.description')}
      actions={
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={fullUrl}
              onChange={(e) => setFullUrl(e.target.checked)}
              className="rounded"
            />
            {t('tools.urlEncode.fullUrlMode')}
          </label>
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('encode')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'encode'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.urlEncode.encode')}
            </button>
            <button
              onClick={() => setMode('decode')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'decode'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.urlEncode.decode')}
            </button>
          </div>
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? t('tools.urlEncode.encodePlaceholder') : t('tools.urlEncode.decodePlaceholder')}
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
