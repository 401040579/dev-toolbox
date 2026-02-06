import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateShades, generateTints } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function ColorShades() {
  const { t } = useTranslation();
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [steps, setSteps] = useState(11);

  const shades = generateShades(baseColor, steps);
  const tints = generateTints(baseColor, steps);
  const shadesHexes = shades.map((s) => s.hex).join(', ');
  const tailwindVars = shades
    .map((s, i) => {
      const weight = Math.round((i / (shades.length - 1)) * 900) + 50;
      return `  ${weight}: '${s.hex}',`;
    })
    .join('\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.colorShades.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.colorShades.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.colorShades.baseColor')}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-border"
              />
              <input
                type="text"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-28 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.colorShades.steps')}
            </label>
            <input
              type="number"
              min={3}
              max={21}
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value) || 11)}
              className="w-20"
            />
          </div>
        </div>

        {/* Shades (lightness variations) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.colorShades.shades')}
            </label>
            <CopyButton text={shadesHexes} />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {shades.map((s, i) => (
              <div
                key={i}
                className="flex-1 h-16 relative group cursor-pointer"
                style={{ backgroundColor: s.hex }}
                onClick={() => navigator.clipboard.writeText(s.hex)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-mono px-1 rounded bg-black/50 text-white">{s.hex}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex mt-1">
            {shades.map((s, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[10px] text-text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tints (saturation variations) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.colorShades.tints')}
            </label>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {tints.map((s, i) => (
              <div
                key={i}
                className="flex-1 h-16 relative group cursor-pointer"
                style={{ backgroundColor: s.hex }}
                onClick={() => navigator.clipboard.writeText(s.hex)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-mono px-1 rounded bg-black/50 text-white">{s.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tailwind-like output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.colorShades.tailwindConfig')}
            </label>
            <CopyButton text={`{\n${tailwindVars}\n}`} />
          </div>
          <pre className="p-3 rounded-lg bg-surface-alt text-xs font-mono text-text-primary overflow-x-auto">
            {`{\n${tailwindVars}\n}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
