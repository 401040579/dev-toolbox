import { validateBatch } from './protocol';
let pending: { file: File; expires: number } | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
/** One bounded file in tab memory, never in a URL or persistent browser storage. */
export function handoffQrFile(file: File): void {
  validateBatch([file]);
  clearTimeout(timer);
  pending = { file, expires: Date.now() + 5 * 60_000 };
  timer = setTimeout(() => { pending = undefined; }, 5 * 60_000);
}
export function peekQrFile(): File | undefined { return pending && pending.expires > Date.now() ? pending.file : undefined; }
export function consumeQrFile(): File | undefined {
  const value = pending; pending = undefined; clearTimeout(timer);
  return value && value.expires > Date.now() ? value.file : undefined;
}
