import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Base = 'dec' | 'hex' | 'bin' | 'oct';

export default function NumberBase() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState<Base>('dec');

  const results = useMemo(() => {
    if (!input.trim()) return null;
    try {
      let decValue: bigint;
      const cleanInput = input.trim();

      switch (fromBase) {
        case 'dec':
          decValue = BigInt(cleanInput);
          break;
        case 'hex':
          decValue = BigInt('0x' + cleanInput.replace(/^0x/i, ''));
          break;
        case 'bin':
          decValue = BigInt('0b' + cleanInput.replace(/^0b/i, ''));
          break;
        case 'oct':
          decValue = BigInt('0o' + cleanInput.replace(/^0o/i, ''));
          break;
      }

      return {
        dec: decValue.toString(10),
        hex: decValue.toString(16).toUpperCase(),
        bin: decValue.toString(2),
        oct: decValue.toString(8),
      };
    } catch {
      return { error: t('tools.numberBase.invalidInput') };
    }
  }, [input, fromBase, t]);

  const bases: { id: Base; label: string; prefix: string }[] = [
    { id: 'dec', label: t('tools.numberBase.decimal'), prefix: '' },
    { id: 'hex', label: t('tools.numberBase.hexadecimal'), prefix: '0x' },
    { id: 'bin', label: t('tools.numberBase.binary'), prefix: '0b' },
    { id: 'oct', label: t('tools.numberBase.octal'), prefix: '0o' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.numberBase.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.numberBase.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Input */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.numberBase.inputLabel')}
            </label>
            <select
              value={fromBase}
              onChange={(e) => setFromBase(e.target.value as Base)}
              className="text-xs px-2 py-1 rounded border border-border bg-surface"
            >
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.numberBase.placeholder')}
            className="w-full max-w-lg font-mono"
          />
        </div>

        {/* Results */}
        {results && (
          <div className="rounded-lg border border-border bg-surface p-4">
            {'error' in results ? (
              <p className="text-error text-sm">{results.error}</p>
            ) : (
              <div className="grid gap-4">
                {bases.map((base) => (
                  <div key={base.id} className="flex items-start gap-3">
                    <span className="text-xs font-medium text-text-muted w-24 pt-1 shrink-0">
                      {base.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {base.prefix && (
                          <span className="text-text-muted font-mono text-sm">{base.prefix}</span>
                        )}
                        <code className="font-mono text-sm text-text-primary break-all">
                          {results[base.id]}
                        </code>
                        <CopyButton text={base.prefix + results[base.id]} size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Common values reference */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            {t('tools.numberBase.commonValues')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              { dec: '255', hex: 'FF', bin: '11111111' },
              { dec: '256', hex: '100', bin: '100000000' },
              { dec: '1024', hex: '400', bin: '10000000000' },
              { dec: '65535', hex: 'FFFF', bin: '1111111111111111' },
            ].map((v, i) => (
              <div key={i} className="p-2 rounded bg-surface-alt text-center">
                <div className="font-mono text-text-primary">{v.dec}</div>
                <div className="text-xs text-text-muted">
                  0x{v.hex} | 0b{v.bin.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
