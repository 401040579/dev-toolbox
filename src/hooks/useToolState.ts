import { useState, useEffect, useCallback } from 'react';

export function useToolState<T>(toolId: string, initialState: T) {
  const storageKey = `dev-toolbox-tool-${toolId}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as T) : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
  }, [storageKey, state]);

  const reset = useCallback(() => {
    setState(initialState);
    localStorage.removeItem(storageKey);
  }, [initialState, storageKey]);

  return [state, setState, reset] as const;
}
