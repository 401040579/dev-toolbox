import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculate, type CalcMode } from './index';

const MODES: { mode: CalcMode; labelKey: string }[] = [
  { mode: 'whatPercent', labelKey: 'whatPercent' },
  { mode: 'percentOf', labelKey: 'percentOf' },
  { mode: 'percentChange', labelKey: 'percentChange' },
  { mode: 'addPercent', labelKey: 'addPercent' },
  { mode: 'subtractPercent', labelKey: 'subtractPercent' },
];

export default function PercentageCalc() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CalcMode>('percentOf');
  const [a, setA] = useState('25');
  const [b, setB] = useState('200');

  const result = useMemo(() => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB) || numB === 0 && (mode === 'whatPercent' || mode === 'percentChange')) return null;
    if (isNaN(numA) || isNaN(numB)) return null;
    return calculate(mode, numA, numB);
  }, [mode, a, b]);

  const getLabels = (): { labelA: string; labelB: string } => {
    switch (mode) {
      case 'whatPercent': return { labelA: t('tools.percentageCalc.valueA'), labelB: t('tools.percentageCalc.valueB') };
      case 'percentOf': return { labelA: t('tools.percentageCalc.percent'), labelB: t('tools.percentageCalc.ofValue') };
      case 'percentChange': return { labelA: t('tools.percentageCalc.fromValue'), labelB: t('tools.percentageCalc.toValue') };
      case 'addPercent': return { labelA: t('tools.percentageCalc.value'), labelB: t('tools.percentageCalc.addPercent') };
      case 'subtractPercent': return { labelA: t('tools.percentageCalc.value'), labelB: t('tools.percentageCalc.subtractPercent') };
    }
  };

  const labels = getLabels();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.percentageCalc.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.percentageCalc.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.mode}
              onClick={() => setMode(m.mode)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                mode === m.mode
                  ? 'bg-accent-muted text-accent border-accent'
                  : 'border-border text-text-secondary hover:border-accent'
              }`}
            >
              {t(`tools.percentageCalc.modes.${m.labelKey}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-32">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {labels.labelA}
            </label>
            <input type="number" value={a} onChange={(e) => setA(e.target.value)} className="w-full font-mono" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {labels.labelB}
            </label>
            <input type="number" value={b} onChange={(e) => setB(e.target.value)} className="w-full font-mono" />
          </div>
        </div>

        {result && (
          <div className="p-4 rounded-lg bg-surface-alt text-center">
            <p className="text-3xl font-mono font-bold text-accent">
              {result.result.toFixed(4).replace(/\.?0+$/, '')}
              {(mode === 'whatPercent' || mode === 'percentChange') ? '%' : ''}
            </p>
            <p className="text-sm text-text-muted mt-2 font-mono">{result.formula}</p>
          </div>
        )}
      </div>
    </div>
  );
}
