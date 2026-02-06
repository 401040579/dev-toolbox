import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToCmyk, cmykToRgb } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'hex' | 'rgb' | 'hsl' | 'cmyk';

export default function ColorConverter() {
  const { t } = useTranslation();
  const [hex, setHex] = useState('#3B82F6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [cmyk, setCmyk] = useState({ c: 76, m: 47, y: 0, k: 4 });

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
    setCmyk(rgbToCmyk(r, g, b));
  };

  const handleHexChange = (value: string) => {
    setHex(value);
    const parsed = hexToRgb(value);
    if (parsed) updateFromRgb(parsed.r, parsed.g, parsed.b);
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const updated = { ...rgb, [channel]: Math.max(0, Math.min(255, value)) };
    updateFromRgb(updated.r, updated.g, updated.b);
  };

  const handleHslChange = (channel: 'h' | 's' | 'l', value: number) => {
    const updated = { ...hsl, [channel]: value };
    setHsl(updated);
    const newRgb = hslToRgb(updated.h, updated.s, updated.l);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleCmykChange = (channel: 'c' | 'm' | 'y' | 'k', value: number) => {
    const updated = { ...cmyk, [channel]: Math.max(0, Math.min(100, value)) };
    setCmyk(updated);
    const newRgb = cmykToRgb(updated.c, updated.m, updated.y, updated.k);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const handlePickerChange = (value: string) => {
    const parsed = hexToRgb(value);
    if (parsed) {
      setHex(value);
      updateFromRgb(parsed.r, parsed.g, parsed.b);
    }
  };

  const formats: { mode: Mode; label: string; value: string }[] = [
    { mode: 'hex', label: 'HEX', value: hex },
    { mode: 'rgb', label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { mode: 'hsl', label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { mode: 'cmyk', label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.colorConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.colorConverter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex gap-4 items-start">
          <input
            type="color"
            value={hex}
            onChange={(e) => handlePickerChange(e.target.value)}
            className="w-20 h-20 rounded-lg cursor-pointer border border-border"
          />
          <div
            className="flex-1 h-20 rounded-lg border border-border"
            style={{ backgroundColor: hex }}
          />
        </div>

        {/* HEX */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">HEX</label>
          <div className="flex gap-2">
            <input type="text" value={hex} onChange={(e) => handleHexChange(e.target.value)} className="flex-1 font-mono" />
            <CopyButton text={hex} />
          </div>
        </div>

        {/* RGB */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">RGB</label>
          <div className="grid grid-cols-3 gap-2">
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch}>
                <label className="text-xs text-text-muted">{ch.toUpperCase()}</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, parseInt(e.target.value) || 0)}
                  className="w-full font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* HSL */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">HSL</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-text-muted">H (0-360)</label>
              <input type="number" min={0} max={360} value={hsl.h} onChange={(e) => handleHslChange('h', parseInt(e.target.value) || 0)} className="w-full font-mono" />
            </div>
            <div>
              <label className="text-xs text-text-muted">S (0-100)</label>
              <input type="number" min={0} max={100} value={hsl.s} onChange={(e) => handleHslChange('s', parseInt(e.target.value) || 0)} className="w-full font-mono" />
            </div>
            <div>
              <label className="text-xs text-text-muted">L (0-100)</label>
              <input type="number" min={0} max={100} value={hsl.l} onChange={(e) => handleHslChange('l', parseInt(e.target.value) || 0)} className="w-full font-mono" />
            </div>
          </div>
        </div>

        {/* CMYK */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">CMYK</label>
          <div className="grid grid-cols-4 gap-2">
            {(['c', 'm', 'y', 'k'] as const).map((ch) => (
              <div key={ch}>
                <label className="text-xs text-text-muted">{ch.toUpperCase()}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk[ch]}
                  onChange={(e) => handleCmykChange(ch, parseInt(e.target.value) || 0)}
                  className="w-full font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* All formats */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
            {t('tools.colorConverter.allFormats')}
          </label>
          {formats.map((f) => (
            <div key={f.mode} className="flex items-center gap-3 p-2 rounded bg-surface-alt">
              <span className="text-xs font-medium text-text-muted w-12">{f.label}</span>
              <code className="flex-1 text-sm font-mono text-text-primary">{f.value}</code>
              <CopyButton text={f.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
