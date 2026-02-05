import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'toHex' | 'toString';
type Separator = 'space' | 'none' | 'colon' | 'dash' | '0x';

export default function HexString() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('toHex');
  const [separator, setSeparator] = useState<Separator>('space');
  const [uppercase, setUppercase] = useState(false);

  const separatorMap: Record<Separator, string> = {
    space: ' ',
    none: '',
    colon: ':',
    dash: '-',
    '0x': ' 0x',
  };

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'toHex') {
        const bytes = new TextEncoder().encode(input);
        let hex = Array.from(bytes)
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join(separatorMap[separator]);
        if (separator === '0x') {
          hex = '0x' + hex;
        }
        return { output: uppercase ? hex.toUpperCase() : hex, error: null };
      } else {
        const cleanHex = input.replace(/[^0-9a-fA-F]/g, '');
        if (cleanHex.length % 2 !== 0) {
          return { output: '', error: t('tools.hexString.invalidHexLength') };
        }
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
        }
        return { output: new TextDecoder().decode(bytes), error: null };
      }
    } catch {
      return { output: '', error: t('tools.hexString.error') };
    }
  }, [input, mode, separator, uppercase, t]);

  return (
    <ToolLayout
      toolId="hex-string"
      title={t('tools.hexString.title')}
      description={t('tools.hexString.description')}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {mode === 'toHex' && (
            <>
              <select
                value={separator}
                onChange={(e) => setSeparator(e.target.value as Separator)}
                className="text-xs px-2 py-1 rounded border border-border bg-surface"
              >
                <option value="space">{t('tools.hexString.sepSpace')}</option>
                <option value="none">{t('tools.hexString.sepNone')}</option>
                <option value="colon">{t('tools.hexString.sepColon')}</option>
                <option value="dash">{t('tools.hexString.sepDash')}</option>
                <option value="0x">{t('tools.hexString.sep0x')}</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="rounded"
                />
                <span className="text-text-secondary">{t('tools.hexString.uppercase')}</span>
              </label>
            </>
          )}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('toHex')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'toHex'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.hexString.toHex')}
            </button>
            <button
              onClick={() => setMode('toString')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'toString'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.hexString.toString')}
            </button>
          </div>
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'toHex'
              ? t('tools.hexString.toHexPlaceholder')
              : t('tools.hexString.toStringPlaceholder')
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
