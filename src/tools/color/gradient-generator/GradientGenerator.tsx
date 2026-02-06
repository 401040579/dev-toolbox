import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateCSS, DEFAULT_CONFIG, type GradientConfig, type GradientType } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function GradientGenerator() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<GradientConfig>({ ...DEFAULT_CONFIG, stops: [...DEFAULT_CONFIG.stops] });

  const css = generateCSS(config);
  const fullCSS = `background: ${css};`;

  const updateStop = (index: number, updates: Partial<{ color: string; position: number }>) => {
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  };

  const addStop = () => {
    if (config.stops.length >= 6) return;
    setConfig((prev) => ({
      ...prev,
      stops: [...prev.stops, { color: '#10B981', position: 50 }],
    }));
  };

  const removeStop = (index: number) => {
    if (config.stops.length <= 2) return;
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.gradientGenerator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.gradientGenerator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Preview */}
        <div
          className="w-full h-32 rounded-lg border border-border"
          style={{ background: css }}
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.gradientGenerator.type')}
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig((prev) => ({ ...prev, type: e.target.value as GradientType }))}
              className="w-32"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
              <option value="conic">Conic</option>
            </select>
          </div>

          {(config.type === 'linear' || config.type === 'conic') && (
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.gradientGenerator.angle')} ({config.angle}°)
              </label>
              <input
                type="range"
                min={0}
                max={360}
                value={config.angle}
                onChange={(e) => setConfig((prev) => ({ ...prev, angle: parseInt(e.target.value) }))}
                className="w-40"
              />
            </div>
          )}
        </div>

        {/* Color Stops */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.gradientGenerator.colorStops')}
          </label>
          <div className="space-y-2">
            {config.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(i, { color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                <input
                  type="text"
                  value={stop.color}
                  onChange={(e) => updateStop(i, { color: e.target.value })}
                  className="w-28 font-mono"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(i, { position: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-text-muted w-10">{stop.position}%</span>
                {config.stops.length > 2 && (
                  <button
                    onClick={() => removeStop(i)}
                    className="text-text-muted hover:text-text-primary text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {config.stops.length < 6 && (
            <button onClick={addStop} className="mt-2 text-sm text-accent hover:underline">
              + {t('tools.gradientGenerator.addStop')}
            </button>
          )}
        </div>

        {/* CSS Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">CSS</label>
            <CopyButton text={fullCSS} />
          </div>
          <pre className="p-3 rounded-lg bg-surface-alt text-sm font-mono text-text-primary overflow-x-auto">
            {fullCSS}
          </pre>
        </div>
      </div>
    </div>
  );
}
