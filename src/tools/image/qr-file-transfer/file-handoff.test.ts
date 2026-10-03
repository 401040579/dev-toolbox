import { afterEach, describe, expect, it, vi } from 'vitest';
import { consumeQrFile, handoffQrFile, peekQrFile } from './file-handoff';
import { MAX_FILE_BYTES } from './protocol';
afterEach(() => { consumeQrFile(); vi.useRealTimers(); });
describe('compressed file handoff', () => {
  it('keeps the latest file only, peeks without consuming and consumes exactly once', async () => {
    const a = new File(['one'], 'one'), b = new File(['two'], 'two');
    handoffQrFile(a); handoffQrFile(b);
    expect(peekQrFile()).toBe(b); expect(peekQrFile()).toBe(b);
    expect(consumeQrFile()).toBe(b); expect(consumeQrFile()).toBeUndefined();
    expect(await b.text()).toBe('two');
  });
  it('expires and rejects oversized files before holding a reference', () => {
    vi.useFakeTimers(); handoffQrFile(new File(['file'], 'demo')); vi.advanceTimersByTime(300_001);
    expect(peekQrFile()).toBeUndefined(); expect(consumeQrFile()).toBeUndefined();
    expect(() => handoffQrFile(new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'too-big'))).toThrow('fileLimit');
    expect(peekQrFile()).toBeUndefined();
  });
});
