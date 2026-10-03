import { useCallback, useContext, useEffect, useRef, useState, type SetStateAction } from 'react';
import { DraftContext } from '@/drafts/context';
import { isCompatibleDraft, readToolDraft, writeDraftField, flushToolDraft } from '@/drafts/store';

interface DraftOptions<T> { allowed?: readonly T[]; clearValue?: T; min?: number; max?: number }

/** Persistent input/option state. Transient results and file handles use useState. */
export function useDraftState<T>(field: string, initial: T | (() => T), options?: DraftOptions<T>) {
  const scope = useContext(DraftContext);
  const toolId = scope?.toolId;
  const [state, setLocalState] = useState<T>(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    const compatible = (value: unknown) => isCompatibleDraft(value, fallback, options?.allowed) &&
      (typeof value !== 'number' || ((options?.min === undefined || value >= options.min) && (options?.max === undefined || value <= options.max)));
    const incoming = scope?.incoming?.[field];
    if (scope?.incoming && Object.prototype.hasOwnProperty.call(scope.incoming, field) && compatible(incoming)) return incoming as T;
    if (scope?.cleared && options && Object.prototype.hasOwnProperty.call(options, 'clearValue')) return options.clearValue as T;
    if (toolId) {
      const stored = readToolDraft(toolId)[field];
      if (compatible(stored)) return stored as T;
    }
    return fallback;
  });
  const current = useRef(state);
  const mounted = useRef(true);
  const hasIncoming = Boolean(scope?.incoming && Object.prototype.hasOwnProperty.call(scope.incoming, field));
  const cleared = Boolean(scope?.cleared);

  useEffect(() => {
    mounted.current = true;
    if (toolId && (hasIncoming || cleared)) writeDraftField(toolId, field, current.current);
    return () => { mounted.current = false; if (toolId) flushToolDraft(toolId); };
  }, [toolId, field, hasIncoming, cleared]);

  const setState = useCallback((action: SetStateAction<T>) => {
    if (!mounted.current) return;
    const next = typeof action === 'function' ? (action as (previous: T) => T)(current.current) : action;
    current.current = next;
    setLocalState(next);
    if (toolId) writeDraftField(toolId, field, next);
  }, [toolId, field]);

  return [state, setState] as const;
}
