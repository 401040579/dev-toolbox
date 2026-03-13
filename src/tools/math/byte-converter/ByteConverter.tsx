import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BYTE_UNITS, convertToAll, type ByteUnit } from './index';

export default function ByteConverter() {
  const { t } = useTranslation();
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState<ByteUnit>('GB');

  const allValues = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return convertToAll(num, fromUnit);
  }, [value, fromUnit]);

  const decimalUnits: ByteUnit[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const binaryUnits: ByteUnit[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.byteConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.byteConverter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-32">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.byteConverter.value')}
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
              {t('tools.byteConverter.unit')}
            </label>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value as ByteUnit)} className="w-48">
              <optgroup label="Decimal (SI)">
                {decimalUnits.map((u) => (
                  <option key={u} value={u}>{BYTE_UNITS[u].label}</option>
                ))}
              </optgroup>
              <optgroup label="Binary (IEC)">
                {binaryUnits.filter((u) => u !== 'B').map((u) => (
                  <option key={u} value={u}>{BYTE_UNITS[u].label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {allValues && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.byteConverter.decimal')} (SI, ×1000)
              </h3>
              <div className="space-y-1">
                {decimalUnits.map((u) => (
                  <div key={u} className="flex items-center justify-between p-2 rounded hover:bg-surface-alt">
                    <span className="text-sm text-text-secondary">{BYTE_UNITS[u].label}</span>
                    <code className="text-sm font-mono text-text-primary">{allValues[u]}</code>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.byteConverter.binary')} (IEC, ×1024)
              </h3>
              <div className="space-y-1">
                {binaryUnits.map((u) => (
                  <div key={u} className="flex items-center justify-between p-2 rounded hover:bg-surface-alt">
                    <span className="text-sm text-text-secondary">{BYTE_UNITS[u].label}</span>
                    <code className="text-sm font-mono text-text-primary">{allValues[u]}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
