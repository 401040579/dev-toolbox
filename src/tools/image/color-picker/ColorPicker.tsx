import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { parseColor, hexToRgb, rgbToHex, rgbToHsl, rgbToHsv, type ColorInfo } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function ColorPicker() {
  const { t } = useTranslation();
  const [hex, setHex] = useState('#3B82F6');
  const [color, setColor] = useState<ColorInfo | null>(null);

  useEffect(() => {
    const parsed = parseColor(hex);
    if (parsed) setColor(parsed);
  }, []);

  const handleHexChange = (value: string) => {
    setHex(value);
    const parsed = parseColor(value);
    if (parsed) setColor(parsed);
  };

  const handlePickerChange = (value: string) => {
    setHex(value);
    const rgb = hexToRgb(value);
    if (rgb) {
      setColor({
        hex: value,
        rgb,
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
        hsv: rgbToHsv(rgb.r, rgb.g, rgb.b),
      });
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    if (!color) return;
    const rgb = { ...color.rgb, [channel]: Math.max(0, Math.min(255, value)) };
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHex(newHex);
    setColor({
      hex: newHex,
      rgb,
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      hsv: rgbToHsv(rgb.r, rgb.g, rgb.b),
    });
  };

  const formats = color
    ? [
        { label: 'HEX', value: color.hex },
        { label: 'RGB', value: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})` },
        { label: 'HSL', value: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)` },
        { label: 'HSV', value: `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)` },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.colorPicker.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.colorPicker.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-start">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.colorPicker.pickColor')}
            </label>
            <input
              type="color"
              value={hex}
              onChange={(e) => handlePickerChange(e.target.value)}
              className="w-20 h-20 rounded-lg cursor-pointer border border-border"
            />
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              HEX
            </label>
            <input
              type="text"
              value={hex}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className="w-full font-mono"
            />
          </div>
        </div>

        {color && (
          <>
            <div
              className="w-full h-24 rounded-lg border border-border"
              style={{ backgroundColor: color.hex }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['r', 'g', 'b'] as const).map((ch) => (
                <div key={ch}>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    {ch.toUpperCase()} ({color.rgb[ch]})
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={color.rgb[ch]}
                    onChange={(e) => handleRgbChange(ch, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.colorPicker.colorFormats')}
              </label>
              {formats.map((f) => (
                <div key={f.label} className="flex items-center gap-3 p-2 rounded bg-surface-alt">
                  <span className="text-xs font-medium text-text-muted w-10">{f.label}</span>
                  <code className="flex-1 text-sm font-mono text-text-primary">{f.value}</code>
                  <CopyButton text={f.value} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
