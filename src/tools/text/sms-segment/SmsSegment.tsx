import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Sparkles } from 'lucide-react';
import { CopyButton } from '@/components/copy-button/CopyButton';
import {
  calculateSegments,
  type SmsEncodingMode,
  type PerSegmentInfo,
  type SegmentCalcResult,
} from './index';

const ENCODING_OPTIONS: { value: SmsEncodingMode; labelKey: string }[] = [
  { value: 'auto', labelKey: 'tools.smsSegment.encodingAuto' },
  { value: 'GSM-7', labelKey: 'tools.smsSegment.encodingGsm7' },
  { value: 'UCS-2', labelKey: 'tools.smsSegment.encodingUcs2' },
];

const SAMPLE_KEYS: { key: string; label: string; text: string }[] = [
  { key: 'ascii', label: 'tools.smsSegment.sampleAscii', text: 'tools.smsSegment.sampleAsciiText' },
  { key: 'emoji', label: 'tools.smsSegment.sampleEmoji', text: 'tools.smsSegment.sampleEmojiText' },
  { key: 'chinese', label: 'tools.smsSegment.sampleChinese', text: 'tools.smsSegment.sampleChineseText' },
  { key: 'smart', label: 'tools.smsSegment.sampleSmart', text: 'tools.smsSegment.sampleSmartText' },
];

function visualizeChar(ch: string): string {
  if (ch === '\n') return '↵';
  if (ch === '\r') return '␍';
  if (ch === '\t') return '⇥';
  if (ch === ' ') return '␣';
  return ch;
}

function describeNonGsmChar(ch: string): string {
  return [...ch]
    .map((c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'))
    .join(' ');
}

function statusToneForRemaining(percent: number): 'ok' | 'warn' | 'edge' {
  if (percent >= 95) return 'edge';
  if (percent >= 80) return 'warn';
  return 'ok';
}

export default function SmsSegment() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [encoding, setEncoding] = useState<SmsEncodingMode>('auto');
  const [smartEncoding, setSmartEncoding] = useState(false);
  const [showSegments, setShowSegments] = useState(true);

  const result = useMemo(
    () => calculateSegments(input, { encoding, smartEncoding }),
    [input, encoding, smartEncoding],
  );

  const limit = result.segmentLimit;
  const lastChars = result.segments[result.segments.length - 1]?.charCount ?? 0;
  const lastUsagePercent = limit > 0 ? Math.min(100, Math.round((lastChars / limit) * 100)) : 0;
  const remainingTone = statusToneForRemaining(lastUsagePercent);

  const showSmartEncodingNotice = smartEncoding && result.smartEncodingApplied;
  const showGsm7IncompatibleWarning = result.warnings.includes('gsm7Incompatible');
  const showMixedLineBreaksWarning = result.warnings.includes('mixedLineBreaks');

  const isEmpty = input.length === 0;
  const onPickSample = (key: string) => setInput(t(key));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.smsSegment.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.smsSegment.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            value={encoding}
            options={ENCODING_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            onChange={setEncoding}
            label={t('tools.smsSegment.encodingLabel')}
          />
          <Toggle
            checked={smartEncoding}
            onChange={setSmartEncoding}
            label={t('tools.smsSegment.smartEncoding')}
            icon={<Sparkles size={12} />}
          />
          <Toggle
            checked={showSegments}
            onChange={setShowSegments}
            label={t('tools.smsSegment.showPerSegment')}
          />
        </div>

        {/* Input */}
        <div>
          <div className="flex items-end justify-between mb-2 gap-3 flex-wrap">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.smsSegment.inputLabel')}
            </label>
            <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
              {!isEmpty && (
                <>
                  <span className="text-text-secondary">
                    <span className="text-text-primary">{lastChars}</span>
                    <span className="text-text-muted"> / {limit}</span>
                  </span>
                  <span className="text-border-strong">·</span>
                  <span>
                    {t('tools.smsSegment.currentSegmentOf', {
                      n: result.segmentsCount,
                      total: result.segmentsCount,
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.smsSegment.inputPlaceholder')}
            className="w-full min-h-[8rem] resize-y font-mono text-sm leading-relaxed"
          />

          {!isEmpty && (
            <SegmentRuler segments={result.segments} limit={limit} />
          )}

          {isEmpty && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-text-muted">{t('tools.smsSegment.emptyHint')}</span>
              {SAMPLE_KEYS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onPickSample(s.text)}
                  className="px-2.5 py-1 rounded-md bg-surface-alt hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border hover:border-border-strong transition-colors"
                >
                  {t(s.label)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notices */}
        {showSmartEncodingNotice && (
          <Notice tone="info" icon={<Sparkles size={14} />} title={t('tools.smsSegment.smartEncodingApplied')}>
            <div className="flex items-start gap-2 mt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted shrink-0 pt-0.5">
                {t('tools.smsSegment.smartEncodingResult')}
              </span>
              <code className="font-mono text-xs break-all text-text-primary flex-1">{result.smartEncodedMessage}</code>
              <CopyButton text={result.smartEncodedMessage} />
            </div>
          </Notice>
        )}

        {showGsm7IncompatibleWarning && (
          <Notice tone="error" icon={<AlertTriangle size={14} />}>
            {t('tools.smsSegment.gsm7IncompatibleWarning')}
          </Notice>
        )}

        {showMixedLineBreaksWarning && (
          <Notice tone="warning" icon={<AlertTriangle size={14} />}>
            {t('tools.smsSegment.mixedLineBreaksWarning')}
          </Notice>
        )}

        {/* Hero stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label={t('tools.smsSegment.statEncoding')}>
            <EncodingChip
              encoding={result.encoding}
              forced={!result.isAutoEncoding}
              forcedLabel={t('tools.smsSegment.encodingForced')}
            />
          </StatTile>

          <StatTile label={t('tools.smsSegment.statSegments')}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-text-primary tabular-nums">
                {result.segmentsCount}
              </span>
              <SegmentDots count={result.segmentsCount} max={6} />
            </div>
          </StatTile>

          <StatTile label={t('tools.smsSegment.statCharacters')}>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-text-primary tabular-nums">
                {result.numberOfCharacters}
              </span>
              {result.encoding === 'GSM-7' && result.numberOfGraphemes !== result.numberOfCharacters && (
                <span className="text-xs text-text-muted font-mono">
                  / {result.numberOfGraphemes}g
                </span>
              )}
            </div>
          </StatTile>

          <StatTile label={t('tools.smsSegment.statRemaining')}>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono tabular-nums ${
                  remainingTone === 'edge'
                    ? 'text-error'
                    : remainingTone === 'warn'
                      ? 'text-warning'
                      : 'text-accent'
                }`}
              >
                {result.remainingInLastSegment}
              </span>
              <StatusDot tone={remainingTone} />
            </div>
          </StatTile>
        </div>

        {/* Boundary callout */}
        {!isEmpty && result.remainingInLastSegment <= 10 && (
          <div className="text-xs text-text-muted font-mono">
            {result.remainingInLastSegment === 0
              ? t('tools.smsSegment.atSegmentEdge')
              : result.remainingInLastSegment === 1
                ? t('tools.smsSegment.atSegmentEdge')
                : t('tools.smsSegment.untilNextSegment', {
                    n: result.remainingInLastSegment,
                    next: result.segmentsCount + 1,
                  })}
          </div>
        )}

        {/* Detail rows + non-GSM */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DetailTable result={result} t={t} />

          {result.nonGsmCharacters.length > 0 && (
            <NonGsmList chars={result.nonGsmCharacters} t={t} />
          )}
        </div>

        {/* Per-segment breakdown */}
        {showSegments && !isEmpty && (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-surface-alt">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.smsSegment.segmentsBreakdown')}
              </p>
              <span className="text-xs font-mono text-text-muted">
                {result.segmentsCount}
                <span className="text-border-strong"> · </span>
                {result.encoding}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {result.segments.map((seg) => (
                <SegmentRow key={seg.index} segment={seg} limit={limit} encoding={result.encoding} t={t} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────── Sub-components ────── */

interface SegmentedControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}

function SegmentedControl<T extends string>({ value, options, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex p-0.5 rounded-md border border-border bg-surface">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all duration-150 ${
                active
                  ? 'bg-accent-muted text-accent shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon?: React.ReactNode;
}

function Toggle({ checked, onChange, label, icon }: ToggleProps) {
  return (
    <label className="flex flex-col gap-1.5 cursor-pointer select-none">
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider invisible">·</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
          checked
            ? 'bg-accent-muted border-accent/40 text-accent'
            : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
        }`}
      >
        <span className={`inline-block w-3 h-3 rounded-sm border transition-colors ${
          checked ? 'bg-accent border-accent' : 'border-border-strong'
        }`} />
        {icon}
        {label}
      </button>
    </label>
  );
}

interface SegmentRulerProps {
  segments: PerSegmentInfo[];
  limit: number;
}

function SegmentRuler({ segments, limit }: SegmentRulerProps) {
  const lastIdx = segments.length - 1;
  return (
    <div className="mt-3">
      <div className="flex gap-1">
        {segments.map((seg, i) => {
          const usage = limit > 0 ? Math.min(100, (seg.charCount / limit) * 100) : 0;
          const isLast = i === lastIdx;
          return (
            <div
              key={seg.index}
              className="flex-1 h-1.5 rounded-full bg-surface-alt overflow-hidden relative"
              title={`Segment ${i + 1}: ${seg.charCount}/${limit}`}
            >
              <div
                className={`h-full transition-all duration-200 ${
                  isLast ? 'bg-accent' : 'bg-accent/50'
                }`}
                style={{ width: `${usage}%` }}
              />
              {/* Quarter ticks */}
              {[25, 50, 75].map((tick) => (
                <span
                  key={tick}
                  className="absolute top-0 bottom-0 w-px bg-background/40 pointer-events-none"
                  style={{ left: `${tick}%` }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StatTileProps {
  label: string;
  children: React.ReactNode;
}

function StatTile({ label, children }: StatTileProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-surface-alt border border-border/60">
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  );
}

interface EncodingChipProps {
  encoding: 'GSM-7' | 'UCS-2';
  forced: boolean;
  forcedLabel: string;
}

function EncodingChip({ encoding, forced, forcedLabel }: EncodingChipProps) {
  const isGsm = encoding === 'GSM-7';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-sm font-semibold ${
          isGsm
            ? 'bg-accent-muted text-accent border border-accent/30'
            : 'bg-info/15 text-info border border-info/30'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isGsm ? 'bg-accent' : 'bg-info'}`} />
        {encoding}
      </span>
      {forced && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-surface-hover text-text-muted border border-border">
          {forcedLabel}
        </span>
      )}
    </div>
  );
}

function SegmentDots({ count, max }: { count: number; max: number }) {
  const dots = Math.min(count, max);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} className="w-1 h-3 rounded-sm bg-accent/70" />
      ))}
      {count > max && <span className="text-[10px] text-text-muted ml-0.5">+{count - max}</span>}
    </span>
  );
}

function StatusDot({ tone }: { tone: 'ok' | 'warn' | 'edge' }) {
  const cls =
    tone === 'edge'
      ? 'bg-error animate-pulse'
      : tone === 'warn'
        ? 'bg-warning'
        : 'bg-success';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

interface NoticeProps {
  tone: 'info' | 'warning' | 'error';
  icon: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}

function Notice({ tone, icon, title, children }: NoticeProps) {
  const cls = {
    info: 'border-accent/30 bg-accent-muted/30 text-accent',
    warning: 'border-warning/40 bg-warning/10 text-warning',
    error: 'border-error/40 bg-error/10 text-error',
  }[tone];
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm ${cls}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-text-primary">{title}</p>}
        <div className={`text-text-secondary ${title ? '' : 'text-text-primary'}`}>{children}</div>
      </div>
    </div>
  );
}

interface DetailTableProps {
  result: SegmentCalcResult;
  t: (k: string, opts?: Record<string, unknown>) => string;
}

function DetailTable({ result, t }: DetailTableProps) {
  const rows: { key: string; label: string; value: string | number }[] = [
    { key: 'graphemes', label: t('tools.smsSegment.statGraphemes'), value: result.numberOfGraphemes },
    { key: 'unicodeScalars', label: t('tools.smsSegment.statUnicodeScalars'), value: result.numberOfUnicodeScalars },
    { key: 'utf8Bytes', label: t('tools.smsSegment.statUtf8Bytes'), value: `${result.utf8Bytes} B` },
    { key: 'totalBits', label: t('tools.smsSegment.statTotalBits'), value: `${result.totalBits} bits` },
    { key: 'messageBits', label: t('tools.smsSegment.statMessageBits'), value: `${result.messageBits} bits` },
    {
      key: 'segmentLimit',
      label: t('tools.smsSegment.statSegmentLimit'),
      value: result.segmentsCount <= 1
        ? `${result.perSegmentLimit} (${t('tools.smsSegment.singleSegment')})`
        : `${result.perConcatLimit} (${t('tools.smsSegment.concatSegment')})`,
    },
    {
      key: 'lineBreaks',
      label: t('tools.smsSegment.statLineBreaks'),
      value: result.lineBreakStyle ?? t('tools.smsSegment.lineBreaksNone'),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {rows.map(({ key, label, value }) => (
            <tr key={key}>
              <td className="px-4 py-2 text-text-secondary">{label}</td>
              <td className="px-4 py-2 text-right font-mono text-text-primary">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface NonGsmListProps {
  chars: string[];
  t: (k: string, opts?: Record<string, unknown>) => string;
}

function NonGsmList({ chars, t }: NonGsmListProps) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-surface-alt">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {t('tools.smsSegment.nonGsmCharsLabel')}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Info size={11} />
          {t('tools.smsSegment.nonGsmHint')}
        </span>
      </div>
      <div className="p-3 flex flex-wrap gap-1.5">
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="inline-flex flex-col items-center justify-center min-w-[3rem] px-2 py-1.5 rounded-md bg-surface-alt border border-border hover:border-info/50 transition-colors"
            title={describeNonGsmChar(ch)}
          >
            <span className="font-mono text-base text-text-primary leading-tight">{visualizeChar(ch)}</span>
            <span className="text-[9px] text-text-muted font-mono mt-0.5">{describeNonGsmChar(ch)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface SegmentRowProps {
  segment: PerSegmentInfo;
  limit: number;
  encoding: 'GSM-7' | 'UCS-2';
  t: (k: string, opts?: Record<string, unknown>) => string;
}

function SegmentRow({ segment, limit, encoding, t }: SegmentRowProps) {
  const usage = limit > 0 ? Math.min(100, (segment.charCount / limit) * 100) : 0;
  const segLabel = (segment.index + 1).toString().padStart(2, '0');
  return (
    <li className="px-4 py-3 space-y-2 hover:bg-surface-alt/40 transition-colors">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono">
        <span className="inline-flex items-baseline gap-1">
          <span className="text-text-muted text-[10px] uppercase tracking-wider">{t('tools.smsSegment.segmentLabel')}</span>
          <span className="font-semibold text-text-primary">{segLabel}</span>
        </span>
        <span className="text-text-secondary">
          <span className="text-text-primary">{segment.charCount}</span>
          <span className="text-text-muted">/{limit}</span>{' '}
          {encoding === 'GSM-7' ? t('tools.smsSegment.units') : t('tools.smsSegment.chars')}
        </span>
        <span className="text-text-muted">
          {segment.bits} {t('tools.smsSegment.bits')}
        </span>
        {segment.hasUdh && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-info/15 text-info text-[9px] font-semibold uppercase tracking-wider border border-info/20"
            title={t('tools.smsSegment.udhTooltip')}
          >
            {t('tools.smsSegment.udh')}
          </span>
        )}
        <span className="ml-auto text-text-muted tabular-nums">{Math.round(usage)}%</span>
      </div>

      <div className="h-1 rounded-full bg-surface-alt overflow-hidden">
        <div
          className="h-full bg-accent/80 transition-all duration-200"
          style={{ width: `${usage}%` }}
        />
      </div>

      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-background/60 border border-border/60 rounded-md px-3 py-2 max-h-32 overflow-auto text-text-primary leading-relaxed">
        {segment.text || ' '}
      </pre>
    </li>
  );
}
