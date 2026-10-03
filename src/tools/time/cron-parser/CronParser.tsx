import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CRON_FIELD_KEYS, parseCron, nextCronRuns } from '@/lib/cron';
import { describeCronFields } from '@/i18n/cron-copy';

const PRESET_KEYS = [
  { key: 'everyMinute', value: '* * * * *' },
  { key: 'everyHour', value: '0 * * * *' },
  { key: 'everyDayMidnight', value: '0 0 * * *' },
  { key: 'everyMonday', value: '0 0 * * 1' },
  { key: 'every5Minutes', value: '*/5 * * * *' },
  { key: 'firstOfMonth', value: '0 0 1 * *' },
];

export default function CronParser() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'zh' ? 'zh-CN' : 'en-US';
  const [expression, setExpression] = useState('0 0 * * *');

  const result = useMemo(() => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return { error: t('tools.cron.invalidFields'), explanations: [], nextRuns: [] };

    try {
      const fields = parseCron(expression);
      const explanations = describeCronFields(fields, t, locale);
      const nextRuns = nextCronRuns(fields);
      return { error: null, explanations, nextRuns };
    } catch {
      return { error: t('tools.cron.invalidExpression'), explanations: [], nextRuns: [] };
    }
  }, [expression, t, locale]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.cron.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {t('tools.cron.description')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <p className="text-xs text-text-muted">{t('tools.cron.supportedNote')}</p>
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.cron.label')}
          </label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder={t('tools.cron.placeholder')}
            className="w-full max-w-lg font-mono text-lg"
            spellCheck={false}
          />
          <div className="flex gap-1 mt-2 text-xs text-text-muted font-mono max-w-lg">
            {CRON_FIELD_KEYS.map((name, i) => (
              <span key={i} className="flex-1 text-center">{t(`tools.cron.fields.${name}`)}</span>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESET_KEYS.map((p) => (
            <button
              key={p.value}
              onClick={() => setExpression(p.value)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                expression === p.value
                  ? 'border-accent text-accent bg-accent-muted'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {t(`tools.cron.presets.${p.key}`)}
            </button>
          ))}
        </div>

        {result.error ? (
          <p className="text-error text-sm">{result.error}</p>
        ) : (
          <>
            {/* Explanation */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                {t('tools.cron.explanation')}
              </div>
              <div className="space-y-1.5">
                {result.explanations.map((exp, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <code className="font-mono text-accent w-12 text-right shrink-0">
                      {expression.trim().split(/\s+/)[i]}
                    </code>
                    <span className="text-text-primary">{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next runs */}
            {result.nextRuns.length === 0 && <p className="text-sm text-text-muted">{t('tools.cron.noRuns')}</p>}
            {result.nextRuns.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  {t('tools.cron.nextRuns', { count: result.nextRuns.length })}
                </div>
                <div className="space-y-1.5">
                  {result.nextRuns.map((date, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-text-muted text-xs font-mono w-4">{i + 1}</span>
                      <code className="font-mono text-text-primary">{date.toLocaleString(locale)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
