import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UNIT_CATEGORIES, convert, type UnitCategory } from './index';

export default function UnitConverter() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<UnitCategory>('length');
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');

  const catData = UNIT_CATEGORIES[category];
  const unitKeys = Object.keys(catData.units);

  // Reset units when category changes
  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const keys = Object.keys(UNIT_CATEGORIES[cat].units);
    setFromUnit(keys[0]!);
    setToUnit(keys[1] ?? keys[0]!);
  };

  const result = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    const converted = convert(num, fromUnit, toUnit, category);
    return isNaN(converted) ? '' : converted.toPrecision(10).replace(/\.?0+$/, '');
  }, [value, fromUnit, toUnit, category]);

  // All conversions from current value
  const allConversions = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return [];
    return unitKeys.map((key) => {
      const converted = convert(num, fromUnit, key, category);
      return {
        key,
        name: catData.units[key]!.name,
        value: isNaN(converted) ? '-' : converted.toPrecision(10).replace(/\.?0+$/, ''),
      };
    });
  }, [value, fromUnit, category, unitKeys, catData]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.unitConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.unitConverter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(UNIT_CATEGORIES) as UnitCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                category === cat
                  ? 'bg-accent-muted text-accent border-accent'
                  : 'border-border text-text-secondary hover:border-accent'
              }`}
            >
              {UNIT_CATEGORIES[cat].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-32">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.unitConverter.value')}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.unitConverter.from')}
            </label>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="w-36">
              {unitKeys.map((key) => (
                <option key={key} value={key}>{catData.units[key]!.name}</option>
              ))}
            </select>
          </div>
          <span className="text-text-muted pb-2">→</span>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.unitConverter.to')}
            </label>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="w-36">
              {unitKeys.map((key) => (
                <option key={key} value={key}>{catData.units[key]!.name}</option>
              ))}
            </select>
          </div>
        </div>

        {result && (
          <div className="p-4 rounded-lg bg-surface-alt text-center">
            <p className="text-3xl font-mono font-bold text-accent">{result}</p>
            <p className="text-sm text-text-muted mt-1">{catData.units[toUnit]?.name}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.unitConverter.allConversions')}
          </label>
          <div className="space-y-1">
            {allConversions.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 rounded hover:bg-surface-alt">
                <span className="text-sm text-text-secondary">{c.name}</span>
                <code className="text-sm font-mono text-text-primary">{c.value}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
