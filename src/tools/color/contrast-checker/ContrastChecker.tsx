import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateContrast } from './index';

export default function ContrastChecker() {
  const { t } = useTranslation();
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#FFFFFF');

  const result = calculateContrast(fg, bg);

  const badge = (pass: boolean) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${pass ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
      {pass ? t('tools.contrastChecker.pass') : t('tools.contrastChecker.fail')}
    </span>
  );

  const swap = () => {
    setFg(bg);
    setBg(fg);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.contrastChecker.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.contrastChecker.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.contrastChecker.foreground')}
            </label>
            <div className="flex gap-2 items-center">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-border" />
              <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} className="w-28 font-mono" />
            </div>
          </div>

          <button onClick={swap} className="btn btn-secondary text-sm mb-0.5">
            {t('tools.contrastChecker.swap')}
          </button>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.contrastChecker.background')}
            </label>
            <div className="flex gap-2 items-center">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-border" />
              <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} className="w-28 font-mono" />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-6 text-center" style={{ backgroundColor: bg, color: fg }}>
            <p className="text-2xl font-bold mb-1">{t('tools.contrastChecker.previewLarge')}</p>
            <p className="text-base">{t('tools.contrastChecker.previewNormal')}</p>
            <p className="text-sm mt-1">{t('tools.contrastChecker.previewSmall')}</p>
          </div>
        </div>

        {/* Ratio */}
        <div className="text-center p-4 rounded-lg bg-surface-alt">
          <p className="text-sm text-text-muted">{t('tools.contrastChecker.ratio')}</p>
          <p className="text-4xl font-bold text-text-primary">{result.ratio}:1</p>
        </div>

        {/* WCAG Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-surface-alt">
            <h3 className="text-sm font-semibold text-text-primary mb-3">WCAG AA</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{t('tools.contrastChecker.normalText')}</span>
                {badge(result.aa.normal)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{t('tools.contrastChecker.largeText')}</span>
                {badge(result.aa.large)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface-alt">
            <h3 className="text-sm font-semibold text-text-primary mb-3">WCAG AAA</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{t('tools.contrastChecker.normalText')}</span>
                {badge(result.aaa.normal)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{t('tools.contrastChecker.largeText')}</span>
                {badge(result.aaa.large)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
