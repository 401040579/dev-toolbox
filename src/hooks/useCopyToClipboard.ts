import { useCallback, useEffect, useState, useRef } from 'react';

export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copy = useCallback(
    async (text: string) => {
      setCopied(false);
      setFailed(false);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch {
        setFailed(true);
        return false;
      }
    },
    [resetDelay],
  );

  return { copied, failed, copy };
}
