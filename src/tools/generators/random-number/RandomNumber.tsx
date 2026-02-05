import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generateRandomNumbers, calculateStats, NumberType } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function RandomNumber() {
  const { t } = useTranslation();
  const [type, setType] = useState<NumberType>('integer');
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(10);
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [unique, setUnique] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);

  const handleGenerate = () => {
    setNumbers(generateRandomNumbers(count, { type, min, max, decimalPlaces, unique }));
  };

  const stats = useMemo(() => calculateStats(numbers), [numbers]);

  const output = numbers.join('\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.randomNumber.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.randomNumber.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomNumber.typeLabel')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NumberType)}
              className="w-32"
            >
              <option value="integer">{t('tools.randomNumber.typeInteger')}</option>
              <option value="decimal">{t('tools.randomNumber.typeDecimal')}</option>
              <option value="gaussian">{t('tools.randomNumber.typeGaussian')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomNumber.min')}
            </label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(parseInt(e.target.value) || 0)}
              className="w-24"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomNumber.max')}
            </label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(parseInt(e.target.value) || 100)}
              className="w-24"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomNumber.count')}
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              min={1}
              max={1000}
              className="w-24"
            />
          </div>

          {(type === 'decimal' || type === 'gaussian') && (
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.randomNumber.decimalPlaces')}
              </label>
              <input
                type="number"
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Math.max(0, Math.min(10, parseInt(e.target.value) || 2)))}
                min={0}
                max={10}
                className="w-20"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {type === 'integer' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unique}
                onChange={(e) => setUnique(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.randomNumber.unique')}</span>
            </label>
          )}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setMin(1); setMax(6); setCount(1); setType('integer'); }}
            className="px-3 py-1 text-sm rounded-md bg-surface-alt hover:bg-border text-text-secondary"
          >
            {t('tools.randomNumber.presetDice')}
          </button>
          <button
            onClick={() => { setMin(1); setMax(100); setCount(1); setType('integer'); }}
            className="px-3 py-1 text-sm rounded-md bg-surface-alt hover:bg-border text-text-secondary"
          >
            1-100
          </button>
          <button
            onClick={() => { setMin(1); setMax(49); setCount(6); setType('integer'); setUnique(true); }}
            className="px-3 py-1 text-sm rounded-md bg-surface-alt hover:bg-border text-text-secondary"
          >
            {t('tools.randomNumber.presetLottery')}
          </button>
          <button
            onClick={() => { setMin(0); setMax(1); setCount(10); setType('decimal'); setDecimalPlaces(4); }}
            className="px-3 py-1 text-sm rounded-md bg-surface-alt hover:bg-border text-text-secondary"
          >
            0-1
          </button>
        </div>

        <button onClick={handleGenerate} className="btn btn-primary">
          {t('tools.randomNumber.generate')}
        </button>

        {/* Output */}
        {numbers.length > 0 && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                  {t('tools.randomNumber.output')}
                </label>
                <CopyButton text={output} />
              </div>
              <textarea
                readOnly
                value={output}
                className="w-full h-32 resize-none font-mono text-sm bg-surface"
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.randomNumber.statMin')}</p>
                <p className="font-mono text-sm">{stats.min}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.randomNumber.statMax')}</p>
                <p className="font-mono text-sm">{stats.max}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.randomNumber.statMean')}</p>
                <p className="font-mono text-sm">{stats.mean.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.randomNumber.statMedian')}</p>
                <p className="font-mono text-sm">{stats.median.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.randomNumber.statStdDev')}</p>
                <p className="font-mono text-sm">{stats.stdDev.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.randomNumber.statSum')}</p>
                <p className="font-mono text-sm">{stats.sum}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
