import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkerResult<T> {
  result: T | null;
  error: string | null;
  loading: boolean;
}

export function useWorker<TInput, TOutput>(
  createWorker: () => Worker,
  input: TInput,
  options?: { threshold?: number; enabled?: boolean },
): WorkerResult<TOutput> {
  const { threshold = 0, enabled = true } = options ?? {};
  const [state, setState] = useState<WorkerResult<TOutput>>({
    result: null,
    error: null,
    loading: false,
  });
  const workerRef = useRef<Worker | null>(null);
  const createWorkerRef = useRef(createWorker);
  createWorkerRef.current = createWorker;

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = createWorkerRef.current();
    }
    return workerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Check threshold — for string inputs, use length
    if (threshold > 0 && typeof input === 'string' && input.length < threshold) {
      return;
    }

    const worker = getWorker();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const handler = (e: MessageEvent) => {
      if (e.data.error) {
        setState({ result: null, error: e.data.error, loading: false });
      } else {
        setState({ result: e.data.result, error: null, loading: false });
      }
    };

    const errorHandler = (e: ErrorEvent) => {
      setState({ result: null, error: e.message || 'Worker error', loading: false });
    };

    worker.addEventListener('message', handler);
    worker.addEventListener('error', errorHandler);
    worker.postMessage(input);

    return () => {
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errorHandler);
    };
  }, [input, enabled, threshold, getWorker]);

  return state;
}
