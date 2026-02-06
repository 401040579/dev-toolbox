import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePalette, type PaletteType } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const PALETTE_TYPES: PaletteType[] = ['complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic'];

export default function ColorPalette() {
  const { t } = useTranslation();
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [paletteType, setPaletteType] = useState<PaletteType>('complementary');

  const palette = generatePalette(baseColor, paletteType);
  const allHexes = palette.map((c) => c.hex).join(', ');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.colorPalette.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.colorPalette.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.colorPalette.baseColor')}
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
              {t('tools.colorPalette.harmony')}
            </label>
            <select
              value={paletteType}
              onChange={(e) => setPaletteType(e.target.value as PaletteType)}
              className="w-48"
            >
              {PALETTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`tools.colorPalette.types.${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex h-24 rounded-lg overflow-hidden border border-border">
          {palette.map((c, i) => (
            <div
              key={i}
              className="flex-1 cursor-pointer relative group"
              style={{ backgroundColor: c.hex }}
              onClick={() => navigator.clipboard.writeText(c.hex)}
            >
              <div className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/50 text-white">{c.hex}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{t('tools.colorPalette.copyAll')}:</span>
          <CopyButton text={allHexes} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {palette.map((c, i) => (
            <div key={i} className="p-3 rounded-lg bg-surface-alt text-center">
              <div className="w-full h-16 rounded border border-border mb-2" style={{ backgroundColor: c.hex }} />
              <div className="flex items-center justify-center gap-1">
                <code className="text-xs font-mono text-text-primary">{c.hex}</code>
                <CopyButton text={c.hex} />
              </div>
              <p className="text-xs text-text-muted mt-1">
                H:{c.hsl.h} S:{c.hsl.s} L:{c.hsl.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
