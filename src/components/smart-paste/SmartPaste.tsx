import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardPaste, X } from 'lucide-react';
import { getTool } from '@/tools/registry';
import { getToolCopy } from '@/i18n/tool-copy';
import { detectSmartPaste, type SmartPasteCandidate } from '@/lib/smart-detect';
import { isToolInputWithinLimit, queueToolInput } from '@/lib/tool-handoff';

interface SmartPasteProps {
  onClose: () => void;
}

export function SmartPaste({ onClose }: SmartPasteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(true);
  const inputRevision = useRef(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const detection = useMemo(() => detectSmartPaste(input), [input]);
  const candidates = error === 'tooLarge' ? [] : detection.candidates;

  useEffect(() => {
    mountedRef.current = true;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      mountedRef.current = false;
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const updateInput = (value: string) => {
    inputRevision.current += 1;
    if (!isToolInputWithinLimit(value)) {
      setError('tooLarge');
      return;
    }
    setError(null);
    setInput(value);
  };

  const readClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      setError('clipboardUnavailable');
      inputRef.current?.focus();
      return;
    }
    const revision = inputRevision.current;
    setError(null);
    setReading(true);
    try {
      const value = await navigator.clipboard.readText();
      if (!mountedRef.current) return;
      if (inputRevision.current !== revision) {
        setError('clipboardChanged');
        return;
      }
      updateInput(value);
      inputRef.current?.focus();
    } catch {
      if (mountedRef.current) {
        setError('clipboardFailed');
        inputRef.current?.focus();
      }
    } finally {
      if (mountedRef.current) setReading(false);
    }
  };

  const openTool = (candidate: SmartPasteCandidate) => {
    const tool = getTool(candidate.toolId);
    if (!tool) {
      setError('handoffFailed');
      return;
    }
    try {
      queueToolInput(tool.id, candidate.fields);
      navigate(`/tools/${tool.category}/${tool.id}`);
      onClose();
    } catch {
      setError('handoffFailed');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          } else if (event.key === 'Tab') {
            const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea');
            if (!controls?.length) return;
            const first = controls[0]!;
            const last = controls[controls.length - 1]!;
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 id={`${id}-title`} className="text-lg font-semibold text-text-primary">{t('smartPaste.title')}</h2>
            <p id={`${id}-description`} className="mt-1 text-sm text-text-secondary">{t('smartPaste.description')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('smartPaste.close')} className="shrink-0 rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`${id}-input`} className="text-sm font-medium text-text-primary">{t('smartPaste.inputLabel')}</label>
            <button type="button" disabled={reading} onClick={readClipboard} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50">
              <ClipboardPaste size={15} />
              {t(reading ? 'smartPaste.reading' : 'smartPaste.readClipboard')}
            </button>
          </div>
          <textarea
            id={`${id}-input`}
            ref={inputRef}
            value={input}
            onChange={(event) => updateInput(event.target.value)}
            placeholder={t('smartPaste.placeholder')}
            aria-describedby={`${id}-privacy${error ? ` ${id}-error` : ''}`}
            aria-invalid={error === 'tooLarge' || undefined}
            spellCheck={false}
            className="w-full min-h-36 max-h-72 resize-y font-mono text-sm"
          />
          <p id={`${id}-privacy`} className="text-xs text-text-muted">{t('smartPaste.privacy')}</p>
          {error && <p id={`${id}-error`} role="alert" className="text-sm text-error">{t(`smartPaste.${error}`)}</p>}

          <div aria-live="polite" aria-atomic="true" className="text-sm text-text-secondary">
            {candidates.length > 0 ? t('smartPaste.chooseTool') : !error ? t('smartPaste.empty') : null}
          </div>
          {candidates.length > 0 && (
            <ul className="space-y-2" aria-label={t('smartPaste.suggestions')}>
              {candidates.map((candidate, index) => {
                const tool = getTool(candidate.toolId);
                if (!tool) return null;
                return (
                  <li key={candidate.toolId}>
                    <button
                      type="button"
                      onClick={() => openTool(candidate)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-surface-hover ${index === 0 ? 'border-accent/50 bg-accent-muted/30' : 'border-border'}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-text-primary">
                          {getToolCopy(tool, t).name}
                          {index === 0 && <span className="rounded bg-accent-muted px-1.5 py-0.5 text-xs text-accent">{t('smartPaste.recommended')}</span>}
                        </span>
                        <span className="mt-1 block text-xs text-text-secondary">{t(`smartPaste.reasons.${candidate.reason}`)}</span>
                      </span>
                      <ArrowRight size={17} className="shrink-0 text-text-muted" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
