import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info } from 'lucide-react';
import { CopyButton } from '@/components/copy-button/CopyButton';
import {
  calculateSegments,
  type SmsEncodingMode,
  type PerSegmentInfo,
} from './index';

const ENCODING_OPTIONS: { value: SmsEncodingMode; labelKey: string }[] = [
  { value: 'auto', labelKey: 'tools.smsSegment.encodingAuto' },
  { value: 'GSM-7', labelKey: 'tools.smsSegment.encodingGsm7' },
  { value: 'UCS-2', labelKey: 'tools.smsSegment.encodingUcs2' },
];

function visualizeChar(ch: string): string {
  if (ch === '\n') return '⏎\n';
  if (ch === '\r') return '␍';
  if (ch === '\t') return '→';
  return ch;
}

function describeNonGsmChar(ch: string): string {
  const cps = [...ch].map((c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'));
  return cps.join(' ');
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
  const usagePercent = limit > 0 ? Math.min(100, Math.round((lastChars / limit) * 100)) : 0;

  const usageBarColor =
    usagePercent >= 90 ? 'bg-error' : usagePercent >= 75 ? 'bg-warning' : 'bg-accent';

  const showSmartEncodingNotice = smartEncoding && result.smartEncodingApplied;
  const showGsm7IncompatibleWarning = result.warnings.includes('gsm7Incompatible');
  const showMixedLineBreaksWarning = result.warnings.includes('mixedLineBreaks');

  const stats: { key: string; label: string; value: string | number; tone?: 'accent' | 'plain' }[] = [
    { key: 'encoding', label: t('tools.smsSegment.statEncoding'), value: result.encoding, tone: 'accent' },
    { key: 'segments', label: t('tools.smsSegment.statSegments'), value: result.segmentsCount, tone: 'accent' },
    { key: 'characters', label: t('tools.smsSegment.statCharacters'), value: result.numberOfCharacters, tone: 'accent' },
    { key: 'remaining', label: t('tools.smsSegment.statRemaining'), value: result.remainingInLastSegment, tone: 'accent' },
  ];

  const detailRows: { key: string; label: string; value: string | number }[] = [
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
      key: 'lineBreakStyle',
      label: t('tools.smsSegment.statLineBreaks'),
      value: result.lineBreakStyle ?? t('tools.smsSegment.lineBreaksNone'),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.smsSegment.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.smsSegment.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.smsSegment.encodingLabel')}
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value as SmsEncodingMode)}
              className="w-44"
            >
              {ENCODING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={smartEncoding}
              onChange={(e) => setSmartEncoding(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary">{t('tools.smsSegment.smartEncoding')}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={showSegments}
              onChange={(e) => setShowSegments(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary">{t('tools.smsSegment.showPerSegment')}</span>
          </label>
        </div>

        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.smsSegment.inputLabel')}
            </label>
            <span className="text-xs text-text-muted font-mono">
              {result.numberOfCharacters} / {limit}
              {result.segmentsCount > 1 ? ` × ${result.segmentsCount}` : ''}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.smsSegment.inputPlaceholder')}
            className="w-full h-40 resize-y font-mono text-sm"
          />

          {/* Usage bar */}
          {input && (
            <div className="mt-2">
              <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                <div
                  className={`h-full transition-all ${usageBarColor}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>
                  {t('tools.smsSegment.usageLabel', {
                    used: lastChars,
                    limit,
                    segment: result.segmentsCount,
                  })}
                </span>
                <span>{usagePercent}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Notices */}
        {showSmartEncodingNotice && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-accent/30 bg-accent-muted/40 text-sm">
            <Info size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-text-primary font-medium">{t('tools.smsSegment.smartEncodingApplied')}</p>
              <p className="text-text-secondary text-xs mt-1 break-words font-mono">{result.smartEncodedMessage}</p>
            </div>
            <CopyButton text={result.smartEncodedMessage} />
          </div>
        )}

        {showGsm7IncompatibleWarning && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-error/40 bg-error/10 text-sm">
            <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
            <p className="text-text-primary">{t('tools.smsSegment.gsm7IncompatibleWarning')}</p>
          </div>
        )}

        {showMixedLineBreaksWarning && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/40 bg-warning/10 text-sm">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-text-primary">{t('tools.smsSegment.mixedLineBreaksWarning')}</p>
          </div>
        )}

        {/* Headline stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ key, label, value }) => (
            <div key={key} className="p-3 rounded-lg bg-surface-alt text-center">
              <p className="text-2xl font-bold text-accent break-words">{value}</p>
              <p className="text-xs text-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Detail table */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {detailRows.map(({ key, label, value }) => (
                <tr key={key}>
                  <td className="px-4 py-2 font-medium text-text-secondary">{label}</td>
                  <td className="px-4 py-2 text-right font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Non-GSM characters */}
        {result.nonGsmCharacters.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.smsSegment.nonGsmCharsLabel', { count: result.nonGsmCharacters.length })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.nonGsmCharacters.map((ch, i) => (
                <span
                  key={`${ch}-${i}`}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-alt font-mono text-xs"
                  title={describeNonGsmChar(ch)}
                >
                  <span className="text-text-primary text-sm">{visualizeChar(ch) || '␣'}</span>
                  <span className="text-text-muted">{describeNonGsmChar(ch)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Per-segment breakdown */}
        {showSegments && input && result.segments.length > 0 && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="px-4 py-2 border-b border-border bg-surface-alt">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.smsSegment.segmentsBreakdown')}
              </p>
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

interface SegmentRowProps {
  segment: PerSegmentInfo;
  limit: number;
  encoding: 'GSM-7' | 'UCS-2';
  t: (k: string, opts?: Record<string, unknown>) => string;
}

function SegmentRow({ segment, limit, encoding, t }: SegmentRowProps) {
  const usage = limit > 0 ? Math.min(100, Math.round((segment.charCount / limit) * 100)) : 0;
  return (
    <li className="px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="font-semibold text-text-primary">
          {t('tools.smsSegment.segmentNumber', { n: segment.index + 1 })}
        </span>
        <span className="text-text-secondary">
          {segment.charCount} / {limit} {encoding === 'GSM-7' ? t('tools.smsSegment.units') : t('tools.smsSegment.chars')}
        </span>
        <span className="text-text-muted">{segment.bits} bits</span>
        {segment.hasUdh && (
          <span className="px-1.5 py-0.5 rounded bg-accent-muted text-accent text-[10px] uppercase tracking-wider">
            UDH
          </span>
        )}
        <span className="ml-auto text-text-muted">{usage}%</span>
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-surface-alt rounded p-2 max-h-32 overflow-auto">
        {segment.text || ' '}
      </pre>
    </li>
  );
}
