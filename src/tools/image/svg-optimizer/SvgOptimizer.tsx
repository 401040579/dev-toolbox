import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { optimizeSvg, getSvgStats, DEFAULT_OPTIONS, type SvgOptimizeOptions } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function SvgOptimizer() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [options, setOptions] = useState<SvgOptimizeOptions>({ ...DEFAULT_OPTIONS });

  const handleOptimize = () => {
    if (!input.trim()) return;
    setOutput(optimizeSvg(input, options));
  };

  const toggleOption = (key: keyof SvgOptimizeOptions) => {
    setOptions((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (key === 'prettify' && updated.prettify) updated.minify = false;
      if (key === 'minify' && updated.minify) updated.prettify = false;
      return updated;
    });
  };

  const inputStats = input ? getSvgStats(input) : null;
  const outputStats = output ? getSvgStats(output) : null;
  const savings = inputStats && outputStats
    ? Math.round((1 - outputStats.size / inputStats.size) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.svgOptimizer.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.svgOptimizer.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(options) as (keyof SvgOptimizeOptions)[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggleOption(key)}
                className="rounded"
              />
              {t(`tools.svgOptimizer.options.${key}`)}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.svgOptimizer.input')}
              </label>
              {inputStats && (
                <span className="text-xs text-text-muted">
                  {inputStats.elements} elements · {inputStats.size} B
                </span>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('tools.svgOptimizer.inputPlaceholder')}
              className="w-full h-64 resize-none font-mono text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.svgOptimizer.output')}
              </label>
              <div className="flex items-center gap-2">
                {outputStats && (
                  <span className="text-xs text-text-muted">
                    {outputStats.elements} elements · {outputStats.size} B
                    {savings > 0 && <span className="text-success ml-1">(-{savings}%)</span>}
                  </span>
                )}
                {output && <CopyButton text={output} />}
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-64 resize-none font-mono text-xs bg-surface"
            />
          </div>
        </div>

        <button onClick={handleOptimize} className="btn btn-primary">
          {t('tools.svgOptimizer.optimize')}
        </button>

        {output && (
          <div className="p-4 rounded-lg bg-surface-alt">
            <h3 className="text-sm font-medium text-text-primary mb-2">{t('tools.svgOptimizer.preview')}</h3>
            <div
              className="flex justify-center p-4 bg-white rounded border border-border"
              dangerouslySetInnerHTML={{ __html: output }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
