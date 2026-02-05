import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'caesar' | 'rot13' | 'rot47';

function caesarCipher(input: string, shift: number): string {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return input
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
      }
      return char;
    })
    .join('');
}

function rot47(input: string): string {
  return input
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(((code - 33 + 47) % 94) + 33);
      }
      return char;
    })
    .join('');
}

export default function CaesarCipher() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('rot13');
  const [shift, setShift] = useState(13);

  const output = useMemo(() => {
    if (!input) return '';
    switch (mode) {
      case 'caesar':
        return caesarCipher(input, shift);
      case 'rot13':
        return caesarCipher(input, 13);
      case 'rot47':
        return rot47(input);
      default:
        return '';
    }
  }, [input, mode, shift]);

  // Generate all shifts for brute force view
  const allShifts = useMemo(() => {
    if (!input || mode !== 'caesar') return [];
    return Array.from({ length: 26 }, (_, i) => ({
      shift: i,
      result: caesarCipher(input, i),
    }));
  }, [input, mode]);

  return (
    <ToolLayout
      toolId="caesar-cipher"
      title={t('tools.caesarCipher.title')}
      description={t('tools.caesarCipher.description')}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('rot13')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'rot13'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              ROT13
            </button>
            <button
              onClick={() => setMode('rot47')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'rot47'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              ROT47
            </button>
            <button
              onClick={() => setMode('caesar')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === 'caesar'
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.caesarCipher.custom')}
            </button>
          </div>
          {mode === 'caesar' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">{t('tools.caesarCipher.shift')}:</label>
              <input
                type="number"
                min={0}
                max={25}
                value={shift}
                onChange={(e) => setShift(parseInt(e.target.value) || 0)}
                className="w-16 text-xs px-2 py-1 rounded border border-border bg-surface text-center"
              />
              <input
                type="range"
                min={0}
                max={25}
                value={shift}
                onChange={(e) => setShift(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
          )}
        </div>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('tools.caesarCipher.placeholder')}
          className="w-full h-full min-h-[200px] resize-none bg-transparent font-mono text-sm outline-none"
          spellCheck={false}
        />
      }
      output={
        <div className="relative h-full">
          {mode === 'caesar' && input && allShifts.length > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.caesarCipher.result')} (shift={shift})
                </div>
                <div className="flex items-start gap-2">
                  <pre className="font-mono text-sm whitespace-pre-wrap break-all flex-1">
                    {output}
                  </pre>
                  <CopyButton text={output} />
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.caesarCipher.allShifts')}
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {allShifts.map((item) => (
                    <div
                      key={item.shift}
                      className={`flex items-center gap-2 p-1.5 rounded text-sm ${
                        item.shift === shift ? 'bg-accent-muted' : 'hover:bg-surface-alt'
                      }`}
                      onClick={() => setShift(item.shift)}
                    >
                      <span className="w-8 text-text-muted font-mono text-xs">+{item.shift}</span>
                      <span className="font-mono truncate flex-1">{item.result}</span>
                      <CopyButton text={item.result} size={12} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
