import { useEffect } from 'react';

interface ShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function useKeyboardShortcut(
  options: ShortcutOptions,
  callback: (e: KeyboardEvent) => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === options.key.toLowerCase();
      const matchesCtrl = options.ctrl ? e.ctrlKey : !e.ctrlKey;
      const matchesMeta = options.meta ? e.metaKey : !e.metaKey;
      const matchesShift = options.shift ? e.shiftKey : !e.shiftKey;
      const matchesAlt = options.alt ? e.altKey : !e.altKey;

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options.key, options.ctrl, options.meta, options.shift, options.alt, callback]);
}
