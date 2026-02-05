import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateNanoIds, NanoIdType } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function NanoIdGenerator() {
  const { t } = useTranslation();
  const [type, setType] = useState<NanoIdType>('default');
  const [size, setSize] = useState(21);
  const [count, setCount] = useState(5);
  const [customAlphabet, setCustomAlphabet] = useState('');
  const [ids, setIds] = useState<string[]>(() => generateNanoIds(5, { size: 21 }));

  const handleGenerate = () => {
    setIds(generateNanoIds(count, {
      type,
      size,
      customAlphabet: type === 'custom' ? customAlphabet : undefined
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.nanoid.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.nanoid.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.nanoid.typeLabel')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NanoIdType)}
              className="w-40"
            >
              <option value="default">{t('tools.nanoid.typeDefault')}</option>
              <option value="url-safe">{t('tools.nanoid.typeUrlSafe')}</option>
              <option value="hex">{t('tools.nanoid.typeHex')}</option>
              <option value="alphanumeric">{t('tools.nanoid.typeAlphanumeric')}</option>
              <option value="custom">{t('tools.nanoid.typeCustom')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.nanoid.sizeLabel')}
            </label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(Math.max(1, Math.min(128, parseInt(e.target.value) || 21)))}
              min={1}
              max={128}
              className="w-20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.nanoid.countLabel')}
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              className="w-20"
            />
          </div>
        </div>

        {type === 'custom' && (
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.nanoid.customAlphabet')}
            </label>
            <input
              type="text"
              value={customAlphabet}
              onChange={(e) => setCustomAlphabet(e.target.value)}
              placeholder="ABC123..."
              className="w-full font-mono"
            />
          </div>
        )}

        {/* Size Presets */}
        <div className="flex flex-wrap gap-2">
          {[8, 12, 16, 21, 24, 32].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                size === s
                  ? 'bg-accent-muted text-accent'
                  : 'bg-surface-alt hover:bg-border text-text-secondary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} className="btn btn-primary">
          {t('tools.nanoid.generate')}
        </button>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.nanoid.output')}
            </label>
            <CopyButton text={ids.join('\n')} />
          </div>
          <textarea
            readOnly
            value={ids.join('\n')}
            className="w-full h-40 resize-none font-mono text-sm bg-surface"
          />
        </div>

        {/* Info */}
        <div className="text-sm text-text-secondary">
          <p>{t('tools.nanoid.info')}</p>
        </div>
      </div>
    </div>
  );
}
