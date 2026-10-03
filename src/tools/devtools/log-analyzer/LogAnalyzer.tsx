import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download, FileUp, RotateCcw, Trash2 } from 'lucide-react';
import { useDraftState } from '@/hooks/useDraftState';
import { useDebounce } from '@/hooks/useDebounce';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { EMPTY_LOG_FILTERS, LOG_LEVELS, LOG_PAGE_SIZE, MAX_LOG_BYTES, type LogFilters, type LogWorkerQuery, type LogWorkerResult } from './parser';

const sample = `2026-10-02T08:00:00.000Z INFO requestId=req-101 Request started\n2026-10-02T08:00:00.100Z ERROR requestId=req-101 Payment failed\n    Error: Upstream timeout\n        at processPayment (payment.ts:42:9)\n2026-10-02T08:00:00.200Z INFO requestId=req-202 Health check passed\n{"timestamp":"2026-10-02T08:00:00.300Z","level":"warn","requestId":"req-101","message":"Retrying payment"}\n2026-10-02T08:00:01.000Z INFO requestId=req-101 Request completed\nUnrecognized line is kept here\n`;

const buttonClass = 'inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed';
const levelClass: Record<string, string> = {
  ERROR: 'text-error', FATAL: 'text-error', WARN: 'text-warning', INFO: 'text-accent', DEBUG: 'text-text-secondary', TRACE: 'text-text-muted', UNKNOWN: 'text-text-muted',
};

export default function LogAnalyzer() {
  const { t } = useTranslation();
  const [input, setInput] = useDraftState('input', '');
  const [filters, setFilters] = useDraftState<LogFilters>('filters', { ...EMPTY_LOG_FILTERS });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<LogWorkerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const debouncedInput = useDebounce(input, 250);
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const sourceRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<(text: string) => Promise<boolean>>(() => Promise.resolve(false));
  const { copy, copied, failed } = useCopyToClipboard();
  copyRef.current = copy;

  useEffect(() => {
    const sourceGeneration = sourceRef;
    const worker = new Worker(new URL('../../../workers/log.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<LogWorkerResult>) => {
      if (event.data.id !== requestRef.current) return;
      const data = event.data;
      if (data.action) {
        setExporting(false);
        if (data.error) {
          setError(data.error);
          return;
        }
        if (data.action === 'copy') void copyRef.current(data.text ?? '');
        if (data.action === 'download') {
          const url = URL.createObjectURL(new Blob([data.text ?? ''], { type: 'text/plain;charset=utf-8' }));
          const link = document.createElement('a');
          link.href = url;
          link.download = 'filtered-logs.log';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        return;
      }
      setResult(data);
      setLoading(false);
      setExporting(false);
    };
    worker.onerror = () => {
      setLoading(false);
      setExporting(false);
      setError('parseFailed');
    };
    return () => {
      sourceGeneration.current++;
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    sourceRef.current++;
  }, [input]);

  useEffect(() => {
    const id = ++requestRef.current;
    setLoading(true);
    setExporting(false);
    workerRef.current?.postMessage({ id, input: debouncedInput, filters, page } satisfies LogWorkerQuery);
  }, [debouncedInput, filters, page]);

  const processing = loading || input !== debouncedInput;
  const pages = Math.max(1, Math.ceil((result?.matched ?? 0) / LOG_PAGE_SIZE));
  const currentPage = result?.page ?? page;
  const updateFilter = (key: keyof LogFilters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const replaceInput = (value: string) => {
    sourceRef.current++;
    if (value !== input) requestRef.current++;
    setReading(false);
    setError(null);
    setInput(value);
    setPage(1);
  };

  const readFile = async (file: File) => {
    const generation = ++sourceRef.current;
    if (!/\.(log|txt|jsonl)$/i.test(file.name)) {
      setReading(false);
      setError('unsupportedFile');
      return;
    }
    if (file.size > MAX_LOG_BYTES) {
      setReading(false);
      setError('tooLarge');
      return;
    }
    setError(null);
    setReading(true);
    try {
      const text = await file.text();
      if (sourceRef.current !== generation) return;
      replaceInput(text);
    } catch {
      if (sourceRef.current === generation) {
        setError('fileFailed');
        setReading(false);
      }
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void readFile(file);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void readFile(file);
  };

  const exportLogs = (action: 'copy' | 'download') => {
    if (!result?.matched || processing || reading || exporting || result.error) return;
    setExporting(true);
    workerRef.current?.postMessage({ id: ++requestRef.current, input, filters, page, action } satisfies LogWorkerQuery);
  };

  const activeError = error ?? result?.error;

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.logAnalyzer.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.logAnalyzer.description')}</p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 space-y-4">
        <p className="text-xs text-text-muted">{t('tools.logAnalyzer.privacy')}</p>
        <section
          onDragOver={(event) => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setDragging(true); } }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={onDrop}
          className={`rounded-lg border p-3 space-y-3 ${dragging ? 'border-accent bg-accent-muted' : 'border-border'}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="log-input" className="text-xs font-medium text-text-secondary mr-auto">{t('tools.logAnalyzer.input')}</label>
            <button type="button" onClick={() => fileRef.current?.click()} className={buttonClass}><FileUp size={14} />{t('tools.logAnalyzer.chooseFile')}</button>
            <button type="button" onClick={() => { replaceInput(sample); setFilters({ ...EMPTY_LOG_FILTERS }); }} className={buttonClass}>{t('tools.logAnalyzer.loadSample')}</button>
            <button type="button" onClick={() => replaceInput('')} className={buttonClass}><Trash2 size={14} />{t('common.clear')}</button>
            <input ref={fileRef} type="file" accept=".log,.txt,.jsonl" onChange={onFile} className="hidden" aria-label={t('tools.logAnalyzer.chooseFile')} />
          </div>
          <textarea id="log-input" value={input} onChange={(event) => replaceInput(event.target.value)} spellCheck={false} placeholder={t('tools.logAnalyzer.placeholder')} className="w-full min-w-0 h-40 resize-y font-mono text-xs" />
          <p className="text-xs text-text-muted">{reading ? t('tools.logAnalyzer.reading') : t('tools.logAnalyzer.fileHint')}</p>
        </section>

        <section className="rounded-lg border border-border p-3 space-y-3" aria-label={t('tools.logAnalyzer.filters')}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-text-primary">{t('tools.logAnalyzer.filters')}</h2>
            <button type="button" onClick={() => { setFilters({ ...EMPTY_LOG_FILTERS }); setPage(1); }} className={buttonClass}><RotateCcw size={13} />{t('tools.logAnalyzer.resetFilters')}</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="min-w-0 text-xs text-text-muted space-y-1 block"><span>{t('tools.logAnalyzer.keyword')}</span><input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder={t('tools.logAnalyzer.keywordPlaceholder')} className="w-full min-w-0 text-sm" /></label>
            <label className="min-w-0 text-xs text-text-muted space-y-1 block"><span>{t('tools.logAnalyzer.level')}</span><select value={filters.level} onChange={(event) => updateFilter('level', event.target.value)} className="w-full min-w-0 text-sm"><option value="">{t('tools.logAnalyzer.allLevels')}</option>{LOG_LEVELS.map((level) => <option key={level} value={level}>{t(`tools.logAnalyzer.levels.${level}`)}</option>)}</select></label>
            <label className="min-w-0 text-xs text-text-muted space-y-1 block"><span>{t('tools.logAnalyzer.requestId')}</span><input value={filters.requestId} onChange={(event) => updateFilter('requestId', event.target.value)} placeholder={t('tools.logAnalyzer.requestPlaceholder')} className="w-full min-w-0 text-sm" /></label>
            <label className="min-w-0 text-xs text-text-muted space-y-1 block"><span>{t('tools.logAnalyzer.from')}</span><input type="datetime-local" step="1" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="w-full min-w-0 text-sm" /></label>
            <label className="min-w-0 text-xs text-text-muted space-y-1 block"><span>{t('tools.logAnalyzer.to')}</span><input type="datetime-local" step="1" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="w-full min-w-0 text-sm" /></label>
          </div>
          <p className="text-xs text-text-muted">{t('tools.logAnalyzer.timeHint')}</p>
          {!!result?.requests.length && <div className="space-y-2"><p className="text-xs text-text-muted">{t('tools.logAnalyzer.requestHint')}</p><div className="flex flex-wrap gap-1.5">{result.requests.map((request) => <button key={request.id} type="button" className={`max-w-full rounded px-2 py-1 text-xs font-mono break-all border ${filters.requestId === request.id ? 'border-accent text-accent bg-accent-muted' : 'border-border text-text-secondary hover:bg-surface-hover'}`} onClick={() => { setFilters({ ...EMPTY_LOG_FILTERS, requestId: request.id }); setPage(1); }} aria-label={t('tools.logAnalyzer.showRequest', { id: request.id })}>{request.id} ({request.count})</button>)}</div></div>}
        </section>

        {activeError && <p role="alert" className="text-sm text-error">{t(`tools.logAnalyzer.${activeError}`)}</p>}
        {result?.limited && <p className="text-xs text-warning">{t('tools.logAnalyzer.recordLimit', { limit: 100000 })}</p>}

        <section className="space-y-3" aria-label={t('tools.logAnalyzer.results')}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-text-primary mr-auto" aria-live="polite">{processing ? t('tools.logAnalyzer.processing') : t('tools.logAnalyzer.summary', { total: result?.total ?? 0, matched: result?.matched ?? 0, lines: result?.lines ?? 0 })}</h2>
            <button type="button" className={buttonClass} disabled={!result?.matched || processing || reading || exporting || !!result.error} onClick={() => exportLogs('copy')}><Copy size={14} />{copied ? t('common.copied') : t('tools.logAnalyzer.copyResults')}</button>
            <button type="button" className={buttonClass} disabled={!result?.matched || processing || reading || exporting || !!result.error} onClick={() => exportLogs('download')}><Download size={14} />{t('tools.logAnalyzer.downloadResults')}</button>
          </div>
          {failed && <p role="alert" className="text-sm text-error">{t('common.copyError')}</p>}
          {!!result?.unknown && <p className="text-xs text-text-muted">{t('tools.logAnalyzer.unknownHint', { count: result.unknown })}</p>}
          {!input && <p className="rounded-lg border border-border p-6 text-center text-sm text-text-muted">{t('tools.logAnalyzer.empty')}</p>}
          {input && !processing && !activeError && !result?.matched && <p className="rounded-lg border border-border p-6 text-center text-sm text-text-muted">{t('tools.logAnalyzer.noMatches')}</p>}
          {!!input && !activeError && <div className="space-y-2" data-testid="log-records">{result?.records.map((record) => <article key={record.line} className="min-w-0 rounded-lg border border-border bg-surface-alt p-3"><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-2"><span className="text-text-muted">{t('tools.logAnalyzer.line', { start: record.line, end: record.endLine })}</span><span className={`font-medium ${levelClass[record.level]}`}>{t(`tools.logAnalyzer.levels.${record.level}`)}</span>{record.timestamp !== null && <time className="text-text-secondary font-mono" dateTime={new Date(record.timestamp).toISOString()}>{new Date(record.timestamp).toISOString()}</time>}{record.requestId && <button type="button" className="max-w-full text-accent font-mono break-all hover:underline" onClick={() => { setFilters({ ...EMPTY_LOG_FILTERS, requestId: record.requestId! }); setPage(1); }} aria-label={t('tools.logAnalyzer.showRequest', { id: record.requestId })}>{record.requestId}</button>}</div><pre className="font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-64 overflow-auto">{record.raw.slice(0, 4000)}</pre>{record.raw.length > 4000 && <p className="text-xs text-text-muted mt-2">{t('tools.logAnalyzer.previewLimit')}</p>}</article>)}</div>}
          {(result?.matched ?? 0) > LOG_PAGE_SIZE && <div className="flex flex-wrap items-center justify-center gap-3"><button type="button" className={buttonClass} disabled={processing || currentPage <= 1} onClick={() => setPage(currentPage - 1)}>{t('tools.logAnalyzer.previous')}</button><span className="text-xs text-text-muted">{t('tools.logAnalyzer.page', { page: currentPage, pages })}</span><button type="button" className={buttonClass} disabled={processing || currentPage >= pages} onClick={() => setPage(currentPage + 1)}>{t('tools.logAnalyzer.next')}</button></div>}
        </section>
      </div>
    </div>
  );
}
