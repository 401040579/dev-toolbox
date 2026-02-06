import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRESETS, parseCrontab, buildCrontab, describeCrontab, type CrontabPart } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const DEFAULT_PARTS: CrontabPart = { minute: '0', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' };

export default function CrontabGenerator() {
  const { t } = useTranslation();
  const [parts, setParts] = useState<CrontabPart>({ ...DEFAULT_PARTS });
  const [expressionInput, setExpressionInput] = useState('');

  const expression = buildCrontab(parts);
  const description = describeCrontab(expression);

  const handlePartChange = (key: keyof CrontabPart, value: string) => {
    setParts((prev) => ({ ...prev, [key]: value }));
  };

  const handleExpressionInput = (value: string) => {
    setExpressionInput(value);
    const parsed = parseCrontab(value);
    if (parsed) setParts(parsed);
  };

  const applyPreset = (expr: string) => {
    const parsed = parseCrontab(expr);
    if (parsed) {
      setParts(parsed);
      setExpressionInput('');
    }
  };

  const fields: { key: keyof CrontabPart; label: string; hint: string }[] = [
    { key: 'minute', label: t('tools.crontabGenerator.minute'), hint: '0-59' },
    { key: 'hour', label: t('tools.crontabGenerator.hour'), hint: '0-23' },
    { key: 'dayOfMonth', label: t('tools.crontabGenerator.dayOfMonth'), hint: '1-31' },
    { key: 'month', label: t('tools.crontabGenerator.month'), hint: '1-12' },
    { key: 'dayOfWeek', label: t('tools.crontabGenerator.dayOfWeek'), hint: '0-6' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.crontabGenerator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.crontabGenerator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Expression display */}
        <div className="p-4 rounded-lg bg-surface-alt text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <code className="text-2xl font-mono font-bold text-accent">{expression}</code>
            <CopyButton text={expression} />
          </div>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-5 gap-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                {f.label}
              </label>
              <input
                type="text"
                value={parts[f.key]}
                onChange={(e) => handlePartChange(f.key, e.target.value)}
                className="w-full font-mono text-center"
              />
              <p className="text-[10px] text-text-muted text-center mt-0.5">{f.hint}</p>
            </div>
          ))}
        </div>

        {/* Parse input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.crontabGenerator.parseExpression')}
          </label>
          <input
            type="text"
            value={expressionInput}
            onChange={(e) => handleExpressionInput(e.target.value)}
            placeholder="* * * * *"
            className="w-full font-mono"
          />
        </div>

        {/* Presets */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.crontabGenerator.presets')}
          </label>
          <div className="grid grid-cols-2 gap-1">
            {PRESETS.map((p) => (
              <div
                key={p.expression}
                className="flex items-center gap-2 p-2 rounded hover:bg-surface-alt cursor-pointer transition-colors"
                onClick={() => applyPreset(p.expression)}
              >
                <code className="text-xs font-mono text-accent min-w-24">{p.expression}</code>
                <span className="text-xs text-text-secondary">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
