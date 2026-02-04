import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function EpochConverter() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'epoch-to-date' | 'date-to-epoch'>('epoch-to-date');
  const [input, setInput] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentEpoch = Math.floor(now / 1000);

  type DateResult = { type: 'date'; iso: string; utc: string; local: string; relative: string };
  type EpochResult = { type: 'epoch'; seconds: number; milliseconds: number };
  type ErrorResult = { type: 'error'; error: string };
  type Result = DateResult | EpochResult | ErrorResult;

  const getRelativeTimeLocalized = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const abs = Math.abs(diff);
    const dir = diff > 0 ? t('tools.epoch.ago') : t('tools.epoch.fromNow');

    if (abs < 60000) return t('tools.epoch.secondsAgo', { count: Math.floor(abs / 1000), dir });
    if (abs < 3600000) return t('tools.epoch.minutesAgo', { count: Math.floor(abs / 60000), dir });
    if (abs < 86400000) return t('tools.epoch.hoursAgo', { count: Math.floor(abs / 3600000), dir });
    if (abs < 2592000000) return t('tools.epoch.daysAgo', { count: Math.floor(abs / 86400000), dir });
    if (abs < 31536000000) return t('tools.epoch.monthsAgo', { count: Math.floor(abs / 2592000000), dir });
    return t('tools.epoch.yearsAgo', { count: Math.floor(abs / 31536000000), dir });
  };

  const result = useMemo((): Result | null => {
    if (!input.trim()) return null;
    try {
      if (mode === 'epoch-to-date') {
        const num = Number(input.trim());
        if (isNaN(num)) return { type: 'error', error: t('tools.epoch.invalidNumber') };
        const ms = num > 1e12 ? num : num * 1000;
        const d = new Date(ms);
        if (isNaN(d.getTime())) return { type: 'error', error: t('tools.epoch.invalidTimestamp') };
        return {
          type: 'date',
          iso: d.toISOString(),
          utc: d.toUTCString(),
          local: d.toLocaleString(),
          relative: getRelativeTimeLocalized(d),
        };
      } else {
        const d = new Date(input.trim());
        if (isNaN(d.getTime())) return { type: 'error', error: t('tools.epoch.invalidDate') };
        return {
          type: 'epoch',
          seconds: Math.floor(d.getTime() / 1000),
          milliseconds: d.getTime(),
        };
      }
    } catch {
      return { type: 'error', error: t('tools.epoch.parseFailed') };
    }
  }, [input, mode, t]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.epoch.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {t('tools.epoch.description')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Current time */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.epoch.currentEpoch')}
          </div>
          <div className="flex items-center gap-2">
            <code className="text-2xl font-mono text-accent">{currentEpoch}</code>
            <CopyButton text={String(currentEpoch)} />
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => setMode('epoch-to-date')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'epoch-to-date'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.epoch.epochToDate')}
          </button>
          <button
            onClick={() => setMode('date-to-epoch')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'date-to-epoch'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.epoch.dateToEpoch')}
          </button>
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {mode === 'epoch-to-date' ? t('tools.epoch.timestampLabel') : t('tools.epoch.dateLabel')}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'epoch-to-date'
                ? t('tools.epoch.timestampPlaceholder')
                : t('tools.epoch.datePlaceholder')
            }
            className="w-full max-w-lg"
          />
        </div>

        {/* Output */}
        {result && (
          <div className="rounded-lg border border-border bg-surface p-4">
            {result.type === 'error' ? (
              <p className="text-error text-sm">{result.error}</p>
            ) : result.type === 'date' ? (
              <div className="space-y-3">
                <ResultRow label={t('tools.epoch.iso8601')} value={result.iso} />
                <ResultRow label={t('tools.epoch.utc')} value={result.utc} />
                <ResultRow label={t('tools.epoch.local')} value={result.local} />
                <ResultRow label={t('tools.epoch.relative')} value={result.relative} />
              </div>
            ) : (
              <div className="space-y-3">
                <ResultRow label={t('tools.epoch.seconds')} value={String(result.seconds)} />
                <ResultRow label={t('tools.epoch.milliseconds')} value={String(result.milliseconds)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-text-muted w-24 shrink-0">{label}</span>
      <code className="font-mono text-sm text-text-primary">{value}</code>
      <CopyButton text={value} size={14} />
    </div>
  );
}

