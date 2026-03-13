import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateRatio, calculateDimension, COMMON_RATIOS } from './index';

export default function AspectRatio() {
  const { t } = useTranslation();
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');
  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [calcWidth, setCalcWidth] = useState('1280');

  const w = parseInt(width) || 0;
  const h = parseInt(height) || 0;
  const result = w > 0 && h > 0 ? calculateRatio(w, h) : null;

  const cw = parseInt(calcWidth) || 0;
  const calculated = cw > 0 && ratioW > 0 && ratioH > 0 ? calculateDimension('width', cw, ratioW, ratioH) : null;

  const applyRatio = (rw: number, rh: number) => {
    setRatioW(rw);
    setRatioH(rh);
    if (cw > 0) {
      const dim = calculateDimension('width', cw, rw, rh);
      setCalcWidth(String(dim.width));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.aspectRatio.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.aspectRatio.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Calculate ratio from dimensions */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">{t('tools.aspectRatio.fromDimensions')}</h3>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('tools.aspectRatio.width')}</label>
              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="w-28 font-mono" />
            </div>
            <span className="text-text-muted pb-2">×</span>
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('tools.aspectRatio.height')}</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-28 font-mono" />
            </div>
            {result && (
              <div className="pb-2">
                <span className="text-lg font-mono font-bold text-accent">= {result.ratio}</span>
                <span className="text-sm text-text-muted ml-2">({result.decimal.toFixed(4)})</span>
              </div>
            )}
          </div>
        </div>

        {/* Calculate dimension from ratio */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">{t('tools.aspectRatio.fromRatio')}</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('tools.aspectRatio.ratioW')}</label>
              <input type="number" value={ratioW} onChange={(e) => setRatioW(parseInt(e.target.value) || 0)} className="w-20 font-mono" />
            </div>
            <span className="text-text-muted pb-2">:</span>
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('tools.aspectRatio.ratioH')}</label>
              <input type="number" value={ratioH} onChange={(e) => setRatioH(parseInt(e.target.value) || 0)} className="w-20 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">{t('tools.aspectRatio.knownWidth')}</label>
              <input type="number" value={calcWidth} onChange={(e) => setCalcWidth(e.target.value)} className="w-28 font-mono" />
            </div>
            {calculated && (
              <div className="pb-2">
                <span className="text-lg font-mono font-bold text-accent">
                  = {calculated.width} × {calculated.height}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Common ratios */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.aspectRatio.common')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMMON_RATIOS.map((r) => (
              <button
                key={r.label}
                onClick={() => applyRatio(r.w, r.h)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  ratioW === r.w && ratioH === r.h
                    ? 'border-accent bg-accent-muted'
                    : 'border-border hover:border-accent'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{r.label}</p>
                <div className="mt-1 border border-border rounded" style={{
                  width: `${Math.min(60, r.w * 4)}px`,
                  height: `${Math.min(60, r.h * 4)}px`,
                  backgroundColor: 'var(--color-accent-muted)',
                }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
