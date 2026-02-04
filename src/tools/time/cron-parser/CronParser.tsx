import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const FIELD_NAMES = ['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week'] as const;
const FIELD_RANGES = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 6 },
] as const;

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_KEYS = [
  { key: 'everyMinute', value: '* * * * *' },
  { key: 'everyHour', value: '0 * * * *' },
  { key: 'everyDayMidnight', value: '0 0 * * *' },
  { key: 'everyMonday', value: '0 0 * * 1' },
  { key: 'every5Minutes', value: '*/5 * * * *' },
  { key: 'firstOfMonth', value: '0 0 1 * *' },
];

function explainField(field: string, index: number): string {
  const name = FIELD_NAMES[index]!;

  if (field === '*') return `Every ${name.toLowerCase()}`;
  if (field.startsWith('*/')) {
    const step = field.slice(2);
    return `Every ${step} ${name.toLowerCase()}${Number(step) > 1 ? 's' : ''}`;
  }
  if (field.includes(',')) {
    const vals = field.split(',').map((v) => formatValue(v.trim(), index));
    return `${name}: ${vals.join(', ')}`;
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-');
    return `${name}: ${formatValue(start!.trim(), index)} through ${formatValue(end!.trim(), index)}`;
  }
  return `${name}: ${formatValue(field, index)}`;
}

function formatValue(val: string, fieldIndex: number): string {
  const num = Number(val);
  if (isNaN(num)) return val;
  if (fieldIndex === 3) return MONTH_NAMES[num] ?? val;
  if (fieldIndex === 4) return DAY_NAMES[num] ?? val;
  return val;
}

function getNextRuns(expression: string, count: number): Date[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const runs: Date[] = [];
  const now = new Date();
  const check = new Date(now.getTime() + 60000); // Start from next minute
  check.setSeconds(0, 0);

  const maxIterations = 525600; // 1 year of minutes

  for (let i = 0; i < maxIterations && runs.length < count; i++) {
    const minute = check.getMinutes();
    const hour = check.getHours();
    const dayOfMonth = check.getDate();
    const month = check.getMonth() + 1;
    const dayOfWeek = check.getDay();

    if (
      matchField(parts[0]!, minute, FIELD_RANGES[0]) &&
      matchField(parts[1]!, hour, FIELD_RANGES[1]) &&
      matchField(parts[2]!, dayOfMonth, FIELD_RANGES[2]) &&
      matchField(parts[3]!, month, FIELD_RANGES[3]) &&
      matchField(parts[4]!, dayOfWeek, FIELD_RANGES[4])
    ) {
      runs.push(new Date(check));
    }

    check.setMinutes(check.getMinutes() + 1);
  }

  return runs;
}

function matchField(field: string, value: number, _range: { min: number; max: number }): boolean {
  if (field === '*') return true;
  if (field.startsWith('*/')) {
    const step = Number(field.slice(2));
    return value % step === 0;
  }
  return field.split(',').some((part) => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      return start !== undefined && end !== undefined && value >= start && value <= end;
    }
    return Number(part) === value;
  });
}

export default function CronParser() {
  const { t } = useTranslation();
  const [expression, setExpression] = useState('0 0 * * *');

  const result = useMemo(() => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return { error: t('tools.cron.invalidFields'), explanations: [], nextRuns: [] };

    try {
      const explanations = parts.map((p, i) => explainField(p, i));
      const nextRuns = getNextRuns(expression, 5);
      return { error: null, explanations, nextRuns };
    } catch {
      return { error: t('tools.cron.invalidExpression'), explanations: [], nextRuns: [] };
    }
  }, [expression, t]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.cron.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {t('tools.cron.description')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
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
            {FIELD_NAMES.map((name, i) => (
              <span key={i} className="flex-1 text-center">{name}</span>
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
            {result.nextRuns.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  {t('tools.cron.nextRuns', { count: result.nextRuns.length })}
                </div>
                <div className="space-y-1.5">
                  {result.nextRuns.map((date, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-text-muted text-xs font-mono w-4">{i + 1}</span>
                      <code className="font-mono text-text-primary">{date.toLocaleString()}</code>
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
