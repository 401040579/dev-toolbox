import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Download } from 'lucide-react';
import { useDraftState } from '@/hooks/useDraftState';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import {
  compareJson, JSON_DIFF_EXAMPLE, JSON_DIFF_LIMITS, JsonDiffError, serializeJsonDiffReport,
  type DiffFilter, type JsonChange, type JsonDiffReport,
} from './comparison';

const FILTERS: DiffFilter[] = ['all', 'added', 'removed', 'modified'];
const BUTTON_CLASS = 'px-3 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50';
interface ComparisonState {
  left: string;
  right: string;
  report?: JsonDiffReport;
  serialized?: string;
  error?: JsonDiffError;
}

export default function JsonDiff() {
  const { t } = useTranslation();
  const [left, setLeft] = useDraftState('left', '');
  const [right, setRight] = useDraftState('right', '');
  const [filter, setFilter] = useDraftState<DiffFilter>('filter', 'all');
  const [comparison, setComparison] = useState<ComparisonState | null>(null);
  const { copy, copied, failed } = useCopyToClipboard();
  const activeFilter = FILTERS.includes(filter) ? filter : 'all';
  const current = comparison?.left === left && comparison.right === right ? comparison : null;
  const hasInputs = Boolean(left.trim() && right.trim());

  useEffect(() => {
    if (!left.trim() || !right.trim()) return;
    const timer = setTimeout(() => {
      try {
        const report = compareJson(left, right);
        setComparison({ left, right, report, serialized: serializeJsonDiffReport(report) });
      } catch (error) {
        setComparison({ left, right, error: error instanceof JsonDiffError ? error : new JsonDiffError('invalidJson') });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [left, right]);

  const visibleChanges = useMemo(() => {
    const changes = current?.report?.changes ?? [];
    return activeFilter === 'all' ? changes : changes.filter((change) => change.kind === activeFilter);
  }, [current, activeFilter]);

  const clear = () => { setLeft(''); setRight(''); setFilter('all'); setComparison(null); };
  const example = () => { setLeft(JSON_DIFF_EXAMPLE.left); setRight(JSON_DIFF_EXAMPLE.right); setFilter('all'); };
  const download = () => {
    if (!current?.serialized) return;
    const url = URL.createObjectURL(new Blob([current.serialized], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'json-diff-report.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const renderValue = (change: JsonChange, side: 'before' | 'after') => {
    const absent = side === 'before' ? change.kind === 'added' : change.kind === 'removed';
    if (absent) return <p className="text-xs text-text-muted italic">{t('tools.jsonDiff.absent')}</p>;
    const value = side === 'before' ? ('before' in change ? change.before : null) : ('after' in change ? change.after : null);
    return <pre className="font-mono text-xs whitespace-pre-wrap break-all min-w-0 max-h-48 overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-text-primary">{t('tools.jsonDiff.title')}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{t('tools.jsonDiff.description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={BUTTON_CLASS} onClick={example}>{t('tools.jsonDiff.loadExample')}</button>
            <button className={BUTTON_CLASS} onClick={clear} disabled={!left && !right}>{t('tools.jsonDiff.clear')}</button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <p className="px-4 sm:px-6 py-3 text-xs text-text-muted border-b border-border">{t('tools.jsonDiff.supportedNote')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
          {([['left', left, setLeft], ['right', right, setRight]] as const).map(([side, value, setValue]) => (
            <div key={side} className={`min-w-0 p-4 sm:p-6 ${side === 'left' ? 'border-b md:border-b-0 md:border-r border-border' : ''}`}>
              <label htmlFor={`json-diff-${side}`} className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{t(`tools.jsonDiff.${side}`)}</label>
              <textarea
                id={`json-diff-${side}`}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={t(`tools.jsonDiff.${side}Placeholder`)}
                className="w-full min-w-0 h-48 font-mono text-sm resize-y"
                spellCheck={false}
              />
            </div>
          ))}
        </div>
        <div className="p-4 sm:p-6 space-y-4 min-w-0">
          {hasInputs && !current && <p role="status" className="text-sm text-text-muted">{t('tools.jsonDiff.comparing')}</p>}
          {!hasInputs && <p className="text-sm text-text-muted">{t('tools.jsonDiff.emptyState')}</p>}
          {current?.error && (
            <div role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 space-y-1 min-w-0">
              <p className="text-sm text-error">{t(`tools.jsonDiff.errors.${current.error.code}`, {
                side: current.error.side ? t(`tools.jsonDiff.${current.error.side}`) : '',
                depth: JSON_DIFF_LIMITS.depth, nodes: JSON_DIFF_LIMITS.nodes, changes: JSON_DIFF_LIMITS.changes,
                path: JSON_DIFF_LIMITS.pathCharacters,
              })}</p>
              {current.error.detail && <p className="text-xs text-error/80 font-mono break-all">{current.error.detail}</p>}
            </div>
          )}
          {current?.report && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t('tools.jsonDiff.summary')}>
                  <span>{t('tools.jsonDiff.totalCount', { count: current.report.counts.total })}</span>
                  <span className="text-success">{t('tools.jsonDiff.addedCount', { count: current.report.counts.added })}</span>
                  <span className="text-error">{t('tools.jsonDiff.removedCount', { count: current.report.counts.removed })}</span>
                  <span className="text-warning">{t('tools.jsonDiff.modifiedCount', { count: current.report.counts.modified })}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className={`${BUTTON_CLASS} inline-flex items-center gap-1.5`} onClick={() => copy(current.serialized!)}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? t('common.copied') : t('tools.jsonDiff.copyReport')}</button>
                  <button className={`${BUTTON_CLASS} inline-flex items-center gap-1.5`} onClick={download}><Download size={14} />{t('tools.jsonDiff.downloadReport')}</button>
                </div>
              </div>
              {failed && <p role="alert" className="text-xs text-error">{t('common.copyError')}</p>}
              <p className="text-xs text-text-muted">{t('tools.jsonDiff.reportNote')}</p>
              {current.report.equal ? (
                <p role="status" className="rounded-lg p-3 border border-success/30 bg-success/10 text-success text-sm">{t('tools.jsonDiff.equal')}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="json-diff-filter" className="text-xs text-text-muted">{t('tools.jsonDiff.filter')}</label>
                    <select id="json-diff-filter" value={activeFilter} onChange={(event) => setFilter(event.target.value as DiffFilter)} className="min-w-0 max-w-full text-xs">
                      {FILTERS.map((value) => <option key={value} value={value}>{t(`tools.jsonDiff.filters.${value}`)}</option>)}
                    </select>
                    <span className="text-xs text-text-muted">{t('tools.jsonDiff.shownCount', { count: visibleChanges.length })}</span>
                  </div>
                  {visibleChanges.length === 0 && <p className="text-sm text-text-muted">{t('tools.jsonDiff.noMatches')}</p>}
                  <div className="space-y-3 min-w-0">
                    {visibleChanges.map((change) => (
                      <article key={change.path} className="rounded-lg border border-border bg-surface overflow-hidden min-w-0" data-testid="json-diff-change" data-kind={change.kind}>
                        <div className="px-3 py-2 border-b border-border flex flex-wrap items-start gap-2 min-w-0">
                          <span className={`text-xs shrink-0 ${change.kind === 'added' ? 'text-success' : change.kind === 'removed' ? 'text-error' : 'text-warning'}`}>{t(`tools.jsonDiff.kinds.${change.kind}`)}</span>
                          <code className="font-mono text-xs break-all min-w-0">{change.path}</code>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 min-w-0">
                          <div className="p-3 border-b sm:border-b-0 sm:border-r border-border min-w-0">
                            <p className="text-xs text-text-muted mb-2">{t('tools.jsonDiff.before')}</p>
                            {renderValue(change, 'before')}
                          </div>
                          <div className="p-3 min-w-0">
                            <p className="text-xs text-text-muted mb-2">{t('tools.jsonDiff.after')}</p>
                            {renderValue(change, 'after')}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
