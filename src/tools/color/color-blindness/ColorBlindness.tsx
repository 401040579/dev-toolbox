import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { simulateColorBlindness, BLINDNESS_TYPES } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function ColorBlindness() {
  const { t } = useTranslation();
  const [colors, setColors] = useState(['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']);

  const handleColorChange = (index: number, value: string) => {
    setColors((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addColor = () => {
    if (colors.length < 12) {
      setColors((prev) => [...prev, '#808080']);
    }
  };

  const removeColor = (index: number) => {
    if (colors.length > 1) {
      setColors((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.colorBlindness.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.colorBlindness.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.colorBlindness.inputColors')}
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(i, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                {colors.length > 1 && (
                  <button
                    onClick={() => removeColor(i)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {colors.length < 12 && (
              <button onClick={addColor} className="w-10 h-10 rounded border-2 border-dashed border-border text-text-muted hover:border-accent text-lg">
                +
              </button>
            )}
          </div>
        </div>

        {/* Normal vision */}
        <div className="p-3 rounded-lg bg-surface-alt">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.colorBlindness.normalVision')}
          </p>
          <div className="flex h-12 rounded overflow-hidden border border-border">
            {colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>

        {/* Simulations */}
        {BLINDNESS_TYPES.map(({ type, prevalence }) => {
          const simulated = colors.map((c) => simulateColorBlindness(c, type));
          return (
            <div key={type} className="p-3 rounded-lg bg-surface-alt">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {t(`tools.colorBlindness.types.${type}`)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{prevalence}</span>
                  <CopyButton text={simulated.join(', ')} />
                </div>
              </div>
              <div className="flex h-12 rounded overflow-hidden border border-border">
                {simulated.map((c, i) => (
                  <div key={i} className="flex-1 relative group" style={{ backgroundColor: c }}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/50 text-white">{c}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
