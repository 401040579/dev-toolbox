import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { Clock, List, Code, Timer, Hash } from 'lucide-react';

type TabId = 'converter' | 'batch' | 'duration' | 'special' | 'code';

// Constants for special timestamp conversions
const LDAP_EPOCH_DIFF = 116444736000000000n; // 100-nanosecond intervals between 1601 and 1970
const WEBKIT_EPOCH_DIFF = 11644473600000000n; // Microseconds between 1601 and 1970
const HFS_EPOCH_DIFF = 2082844800; // Seconds between 1904 and 1970

export default function EpochConverter() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('converter');
  const [mode, setMode] = useState<'epoch-to-date' | 'date-to-epoch'>('epoch-to-date');
  const [input, setInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [specialInput, setSpecialInput] = useState('');
  const [specialFormat, setSpecialFormat] = useState<'ldap' | 'webkit' | 'hfs' | 'hex'>('ldap');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentEpoch = Math.floor(now / 1000);
  const currentDate = new Date(now);

  // Detect timestamp precision and convert to milliseconds
  const detectAndConvertTimestamp = (num: number): { ms: number; precision: string } => {
    if (num > 1e18) {
      // Nanoseconds
      return { ms: num / 1e6, precision: t('tools.epoch.nanoseconds') };
    } else if (num > 1e15) {
      // Microseconds
      return { ms: num / 1e3, precision: t('tools.epoch.microseconds') };
    } else if (num > 1e12) {
      // Milliseconds
      return { ms: num, precision: t('tools.epoch.milliseconds') };
    } else {
      // Seconds
      return { ms: num * 1000, precision: t('tools.epoch.seconds') };
    }
  };

  const getRelativeTimeLocalized = (date: Date): string => {
    const nowMs = Date.now();
    const diff = nowMs - date.getTime();
    const abs = Math.abs(diff);
    const dir = diff > 0 ? t('tools.epoch.ago') : t('tools.epoch.fromNow');

    if (abs < 60000) return t('tools.epoch.secondsAgo', { count: Math.floor(abs / 1000), dir });
    if (abs < 3600000) return t('tools.epoch.minutesAgo', { count: Math.floor(abs / 60000), dir });
    if (abs < 86400000) return t('tools.epoch.hoursAgo', { count: Math.floor(abs / 3600000), dir });
    if (abs < 2592000000) return t('tools.epoch.daysAgo', { count: Math.floor(abs / 86400000), dir });
    if (abs < 31536000000) return t('tools.epoch.monthsAgo', { count: Math.floor(abs / 2592000000), dir });
    return t('tools.epoch.yearsAgo', { count: Math.floor(abs / 31536000000), dir });
  };

  const getWeekNumber = (d: Date): number => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getDayOfYear = (d: Date): number => {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    return Math.floor(diff / 86400000);
  };

  type DateResult = {
    type: 'date';
    iso: string;
    utc: string;
    local: string;
    relative: string;
    precision: string;
    weekNumber: number;
    dayOfYear: number;
    dayOfWeek: string;
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
  };
  type EpochResult = {
    type: 'epoch';
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
    weekNumber: number;
    dayOfYear: number;
    dayOfWeek: string;
  };
  type ErrorResult = { type: 'error'; error: string };
  type Result = DateResult | EpochResult | ErrorResult;

  const result = useMemo((): Result | null => {
    if (!input.trim()) return null;
    try {
      if (mode === 'epoch-to-date') {
        const num = Number(input.trim());
        if (isNaN(num)) return { type: 'error', error: t('tools.epoch.invalidNumber') };
        const { ms, precision } = detectAndConvertTimestamp(num);
        const d = new Date(ms);
        if (isNaN(d.getTime())) return { type: 'error', error: t('tools.epoch.invalidTimestamp') };
        const epochSeconds = Math.floor(d.getTime() / 1000);
        return {
          type: 'date',
          iso: d.toISOString(),
          utc: d.toUTCString(),
          local: d.toLocaleString(),
          relative: getRelativeTimeLocalized(d),
          precision,
          weekNumber: getWeekNumber(d),
          dayOfYear: getDayOfYear(d),
          dayOfWeek: d.toLocaleDateString(undefined, { weekday: 'long' }),
          seconds: epochSeconds,
          milliseconds: d.getTime(),
          microseconds: d.getTime() * 1000,
          nanoseconds: d.getTime() * 1000000,
        };
      } else {
        const d = new Date(input.trim());
        if (isNaN(d.getTime())) return { type: 'error', error: t('tools.epoch.invalidDate') };
        return {
          type: 'epoch',
          seconds: Math.floor(d.getTime() / 1000),
          milliseconds: d.getTime(),
          microseconds: d.getTime() * 1000,
          nanoseconds: d.getTime() * 1000000,
          weekNumber: getWeekNumber(d),
          dayOfYear: getDayOfYear(d),
          dayOfWeek: d.toLocaleDateString(undefined, { weekday: 'long' }),
        };
      }
    } catch {
      return { type: 'error', error: t('tools.epoch.parseFailed') };
    }
  }, [input, mode, t]);

  // Batch conversion
  const batchResults = useMemo(() => {
    if (!batchInput.trim()) return [];
    const lines = batchInput.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const trimmed = line.trim();
      const num = Number(trimmed);
      if (isNaN(num)) {
        // Try parsing as date
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) {
          return { input: trimmed, error: true, output: t('tools.epoch.invalidInput') };
        }
        return {
          input: trimmed,
          error: false,
          output: `${Math.floor(d.getTime() / 1000)} (${d.toISOString()})`,
        };
      }
      const { ms } = detectAndConvertTimestamp(num);
      const d = new Date(ms);
      if (isNaN(d.getTime())) {
        return { input: trimmed, error: true, output: t('tools.epoch.invalidTimestamp') };
      }
      return {
        input: trimmed,
        error: false,
        output: d.toISOString(),
      };
    });
  }, [batchInput, t]);

  // Duration conversion
  const durationResult = useMemo(() => {
    if (!durationInput.trim()) return null;
    const num = Number(durationInput.trim());
    if (isNaN(num) || num < 0) return { error: t('tools.epoch.invalidNumber') };

    const days = Math.floor(num / 86400);
    const hours = Math.floor((num % 86400) / 3600);
    const minutes = Math.floor((num % 3600) / 60);
    const seconds = Math.floor(num % 60);

    return {
      error: null,
      days,
      hours,
      minutes,
      seconds,
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      totalHours: (num / 3600).toFixed(2),
      totalMinutes: (num / 60).toFixed(2),
    };
  }, [durationInput, t]);

  // Special timestamp conversion
  const specialResult = useMemo(() => {
    if (!specialInput.trim()) return null;
    try {
      let ms: number;
      const trimmed = specialInput.trim();

      switch (specialFormat) {
        case 'ldap': {
          // LDAP timestamp: 100-nanosecond intervals since 1601-01-01
          const ldapTime = BigInt(trimmed);
          const unixNs = ldapTime - LDAP_EPOCH_DIFF;
          ms = Number(unixNs / 10000n);
          break;
        }
        case 'webkit': {
          // WebKit/Chrome timestamp: microseconds since 1601-01-01
          const webkitTime = BigInt(trimmed);
          const unixUs = webkitTime - WEBKIT_EPOCH_DIFF;
          ms = Number(unixUs / 1000n);
          break;
        }
        case 'hfs': {
          // Mac HFS+ timestamp: seconds since 1904-01-01
          const hfsTime = Number(trimmed);
          const unixSeconds = hfsTime - HFS_EPOCH_DIFF;
          ms = unixSeconds * 1000;
          break;
        }
        case 'hex': {
          // Hex timestamp (Unix seconds in hex)
          const hexNum = parseInt(trimmed, 16);
          if (isNaN(hexNum)) throw new Error('Invalid hex');
          ms = hexNum * 1000;
          break;
        }
        default:
          return { error: t('tools.epoch.invalidFormat') };
      }

      const d = new Date(ms);
      if (isNaN(d.getTime())) return { error: t('tools.epoch.invalidTimestamp') };

      return {
        error: null,
        iso: d.toISOString(),
        utc: d.toUTCString(),
        local: d.toLocaleString(),
        unixSeconds: Math.floor(ms / 1000),
      };
    } catch {
      return { error: t('tools.epoch.parseFailed') };
    }
  }, [specialInput, specialFormat, t]);

  // Code examples for getting current epoch
  const codeExamples = [
    { lang: 'JavaScript', code: 'Math.floor(Date.now() / 1000)' },
    { lang: 'Python', code: 'import time; int(time.time())' },
    { lang: 'Java', code: 'System.currentTimeMillis() / 1000L' },
    { lang: 'PHP', code: 'time()' },
    { lang: 'Ruby', code: 'Time.now.to_i' },
    { lang: 'Go', code: 'time.Now().Unix()' },
    { lang: 'Rust', code: 'SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()' },
    { lang: 'C#', code: 'DateTimeOffset.UtcNow.ToUnixTimeSeconds()' },
    { lang: 'Swift', code: 'Int(Date().timeIntervalSince1970)' },
    { lang: 'Kotlin', code: 'System.currentTimeMillis() / 1000' },
    { lang: 'Bash', code: 'date +%s' },
    { lang: 'PowerShell', code: '[int][double]::Parse((Get-Date -UFormat %s))' },
    { lang: 'SQL (MySQL)', code: 'SELECT UNIX_TIMESTAMP()' },
    { lang: 'SQL (PostgreSQL)', code: "SELECT EXTRACT(EPOCH FROM NOW())" },
  ];

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: 'converter', icon: <Clock size={16} />, label: t('tools.epoch.tabConverter') },
    { id: 'batch', icon: <List size={16} />, label: t('tools.epoch.tabBatch') },
    { id: 'duration', icon: <Timer size={16} />, label: t('tools.epoch.tabDuration') },
    { id: 'special', icon: <Hash size={16} />, label: t('tools.epoch.tabSpecial') },
    { id: 'code', icon: <Code size={16} />, label: t('tools.epoch.tabCode') },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.epoch.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {t('tools.epoch.description')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Current time display */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.epoch.currentEpoch')}
              </div>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono text-accent">{currentEpoch}</code>
                <CopyButton text={String(currentEpoch)} />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.epoch.currentTime')}
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-text-primary">{currentDate.toISOString()}</code>
                <CopyButton text={currentDate.toISOString()} />
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-text-muted">{t('tools.epoch.weekNumber')}:</span>{' '}
              <span className="font-mono">{getWeekNumber(currentDate)}</span>
            </div>
            <div>
              <span className="text-text-muted">{t('tools.epoch.dayOfYear')}:</span>{' '}
              <span className="font-mono">{getDayOfYear(currentDate)}</span>
            </div>
            <div>
              <span className="text-text-muted">{t('tools.epoch.dayOfWeek')}:</span>{' '}
              <span className="font-mono">{currentDate.toLocaleDateString(undefined, { weekday: 'short' })}</span>
            </div>
            <div>
              <span className="text-text-muted">{t('tools.epoch.milliseconds')}:</span>{' '}
              <span className="font-mono">{now}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'converter' && (
          <div className="space-y-4">
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
              {mode === 'epoch-to-date' && (
                <p className="text-xs text-text-muted mt-1">{t('tools.epoch.autoDetect')}</p>
              )}
            </div>

            {/* Output */}
            {result && (
              <div className="rounded-lg border border-border bg-surface p-4">
                {result.type === 'error' ? (
                  <p className="text-error text-sm">{result.error}</p>
                ) : result.type === 'date' ? (
                  <div className="space-y-4">
                    <div className="text-xs text-text-muted mb-2">
                      {t('tools.epoch.detectedPrecision')}: <span className="text-text-primary">{result.precision}</span>
                    </div>
                    <div className="grid gap-3">
                      <ResultRow label={t('tools.epoch.iso8601')} value={result.iso} />
                      <ResultRow label={t('tools.epoch.utc')} value={result.utc} />
                      <ResultRow label={t('tools.epoch.local')} value={result.local} />
                      <ResultRow label={t('tools.epoch.relative')} value={result.relative} />
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                        {t('tools.epoch.dateInfo')}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div><span className="text-text-muted">{t('tools.epoch.dayOfWeek')}:</span> {result.dayOfWeek}</div>
                        <div><span className="text-text-muted">{t('tools.epoch.weekNumber')}:</span> {result.weekNumber}</div>
                        <div><span className="text-text-muted">{t('tools.epoch.dayOfYear')}:</span> {result.dayOfYear}</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                        {t('tools.epoch.allFormats')}
                      </div>
                      <div className="grid gap-2">
                        <ResultRow label={t('tools.epoch.seconds')} value={String(result.seconds)} />
                        <ResultRow label={t('tools.epoch.milliseconds')} value={String(result.milliseconds)} />
                        <ResultRow label={t('tools.epoch.microseconds')} value={String(result.microseconds)} />
                        <ResultRow label={t('tools.epoch.nanoseconds')} value={String(result.nanoseconds)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <ResultRow label={t('tools.epoch.seconds')} value={String(result.seconds)} />
                      <ResultRow label={t('tools.epoch.milliseconds')} value={String(result.milliseconds)} />
                      <ResultRow label={t('tools.epoch.microseconds')} value={String(result.microseconds)} />
                      <ResultRow label={t('tools.epoch.nanoseconds')} value={String(result.nanoseconds)} />
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                        {t('tools.epoch.dateInfo')}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div><span className="text-text-muted">{t('tools.epoch.dayOfWeek')}:</span> {result.dayOfWeek}</div>
                        <div><span className="text-text-muted">{t('tools.epoch.weekNumber')}:</span> {result.weekNumber}</div>
                        <div><span className="text-text-muted">{t('tools.epoch.dayOfYear')}:</span> {result.dayOfYear}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.epoch.batchInput')}
              </label>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder={t('tools.epoch.batchPlaceholder')}
                rows={6}
                className="w-full font-mono text-sm"
              />
              <p className="text-xs text-text-muted mt-1">{t('tools.epoch.batchHint')}</p>
            </div>

            {batchResults.length > 0 && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-alt">
                    <tr>
                      <th className="text-left px-4 py-2 text-text-muted font-medium">{t('tools.epoch.input')}</th>
                      <th className="text-left px-4 py-2 text-text-muted font-medium">{t('tools.epoch.output')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {batchResults.map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-mono text-text-secondary">{row.input}</td>
                        <td className={`px-4 py-2 font-mono ${row.error ? 'text-error' : 'text-text-primary'}`}>
                          <div className="flex items-center gap-2">
                            <span className="break-all">{row.output}</span>
                            {!row.error && <CopyButton text={row.output} size={14} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'duration' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.epoch.durationInput')}
              </label>
              <input
                type="text"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder={t('tools.epoch.durationPlaceholder')}
                className="w-full max-w-lg"
              />
            </div>

            {durationResult && (
              <div className="rounded-lg border border-border bg-surface p-4">
                {durationResult.error ? (
                  <p className="text-error text-sm">{durationResult.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-2xl font-mono text-accent">{durationResult.formatted}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-surface-alt">
                        <div className="text-3xl font-mono text-text-primary">{durationResult.days}</div>
                        <div className="text-xs text-text-muted uppercase">{t('tools.epoch.days')}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-surface-alt">
                        <div className="text-3xl font-mono text-text-primary">{durationResult.hours}</div>
                        <div className="text-xs text-text-muted uppercase">{t('tools.epoch.hours')}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-surface-alt">
                        <div className="text-3xl font-mono text-text-primary">{durationResult.minutes}</div>
                        <div className="text-xs text-text-muted uppercase">{t('tools.epoch.minutes')}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-surface-alt">
                        <div className="text-3xl font-mono text-text-primary">{durationResult.seconds}</div>
                        <div className="text-xs text-text-muted uppercase">{t('tools.epoch.secondsUnit')}</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
                      <ResultRow label={t('tools.epoch.totalHours')} value={durationResult.totalHours!} />
                      <ResultRow label={t('tools.epoch.totalMinutes')} value={durationResult.totalMinutes!} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'special' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.epoch.specialFormat')}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ldap', 'webkit', 'hfs', 'hex'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setSpecialFormat(fmt)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      specialFormat === fmt
                        ? 'bg-accent-muted text-accent'
                        : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {t(`tools.epoch.format_${fmt}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.epoch.specialInput')}
              </label>
              <input
                type="text"
                value={specialInput}
                onChange={(e) => setSpecialInput(e.target.value)}
                placeholder={t(`tools.epoch.placeholder_${specialFormat}`)}
                className="w-full max-w-lg font-mono"
              />
              <p className="text-xs text-text-muted mt-1">{t(`tools.epoch.hint_${specialFormat}`)}</p>
            </div>

            {specialResult && (
              <div className="rounded-lg border border-border bg-surface p-4">
                {specialResult.error ? (
                  <p className="text-error text-sm">{specialResult.error}</p>
                ) : (
                  <div className="space-y-3">
                    <ResultRow label={t('tools.epoch.iso8601')} value={specialResult.iso!} />
                    <ResultRow label={t('tools.epoch.utc')} value={specialResult.utc!} />
                    <ResultRow label={t('tools.epoch.local')} value={specialResult.local!} />
                    <ResultRow label={t('tools.epoch.unixSeconds')} value={String(specialResult.unixSeconds!)} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">{t('tools.epoch.codeDescription')}</p>
            <div className="grid gap-2">
              {codeExamples.map(({ lang, code }) => (
                <div key={lang} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-border">
                  <span className="text-sm font-medium text-text-muted w-28 shrink-0">{lang}</span>
                  <code className="flex-1 font-mono text-sm text-text-primary break-all">{code}</code>
                  <CopyButton text={code} size={14} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-text-muted w-28 shrink-0">{label}</span>
      <code className="font-mono text-sm text-text-primary break-all">{value}</code>
      <CopyButton text={value} size={14} />
    </div>
  );
}
