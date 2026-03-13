import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { evaluate } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function MathEvaluator() {
  const { t } = useTranslation();
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);

  const handleEvaluate = () => {
    if (!expression.trim()) return;
    try {
      const result = evaluate(expression);
      const resultStr = Number.isFinite(result) ? String(result) : 'Error';
      setHistory((prev) => [{ expr: expression, result: resultStr }, ...prev.slice(0, 19)]);
    } catch {
      setHistory((prev) => [{ expr: expression, result: 'Error' }, ...prev.slice(0, 19)]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEvaluate();
  };

  const latestResult = history.length > 0 ? history[0]!.result : '';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.mathEvaluator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.mathEvaluator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.mathEvaluator.expression')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 2^10 + sqrt(144) * 3"
              className="flex-1 font-mono"
            />
            <button onClick={handleEvaluate} className="btn btn-primary">
              =
            </button>
          </div>
        </div>

        {latestResult && (
          <div className="p-4 rounded-lg bg-surface-alt text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-mono font-bold text-accent">{latestResult}</p>
              <CopyButton text={latestResult} />
            </div>
          </div>
        )}

        <div className="text-xs text-text-muted p-3 rounded bg-surface-alt">
          <p className="font-medium mb-1">{t('tools.mathEvaluator.supported')}:</p>
          <p>+, -, *, /, %, ^ (power), sqrt(), abs(), pi, e, ()</p>
        </div>

        {history.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.mathEvaluator.history')}
            </label>
            <div className="space-y-1">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-surface-alt">
                  <code className="text-sm font-mono text-text-secondary">{h.expr}</code>
                  <code className="text-sm font-mono text-text-primary font-bold">= {h.result}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
