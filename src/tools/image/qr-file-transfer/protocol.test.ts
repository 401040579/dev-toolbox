import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { initSync } from '@raptorqr/raptorq-wasm';
import { FileReceiver, prepareFile, frameAt } from './engine';
import { parseFrame, encodeFrame, crc32, validateBatch, safeFilename, sha256, MAX_FILE_BYTES, MAX_BATCH_BYTES, MAX_FILES, MAX_ACTIVE_FILES, SYMBOL_BYTES } from './protocol';

beforeAll(() => initSync({ module: readFileSync('node_modules/@raptorqr/raptorq-wasm/src/wasm/raptorqr_raptorq_wasm_bg.wasm') }));
const input = () => Uint8Array.from({ length: 17_000 }, (_, index) => (index * 137 + Math.floor(index / 256)) % 256);
async function fixture(name = '测试文件.bin', bytes = input()) { return prepareFile(new File([bytes], name, { type: 'application/octet-stream' })); }

describe('optical file transfer, real RaptorQ WASM', () => {
  it('recovers exact arbitrary bytes with 20% dropped frames, reversed order and duplicates', async () => {
    const file = await fixture(), receiver = new FileReceiver();
    let complete;
    const frames = file.order.map((_, index) => frameAt(file, index)).filter((_, index) => index % 5 !== 0).reverse();
    for (const frame of frames) {
      const result = await receiver.accept(frame);
      if (result.type === 'complete') complete = result;
      expect((await receiver.accept(frame)).type).toBe('ignored');
    }
    expect(complete?.bytes).toEqual(input());
    expect(complete?.progress.metadata.name).toBe('测试文件.bin');
    expect(await sha256(complete!.bytes)).toBe(file.metadata.hash);
    receiver.clear();
  });
  it.each([0, 1, 383, 384, 385])('restores boundary file size %i', async (size) => {
    const bytes = new Uint8Array(size).fill(0xff), file = await fixture('boundary.bin', bytes), receiver = new FileReceiver();
    let result;
    for (let index = 0; index < file.order.length; index++) { const value = await receiver.accept(frameAt(file, index)); if (value.type === 'complete') result = value; }
    expect(result?.bytes).toEqual(bytes); receiver.clear();
  });
  it('separates interleaved files with equal lengths and deduplicates completed files', async () => {
    const a = await fixture('a'), b = await fixture('b', input().fill(42)), receiver = new FileReceiver();
    const completed: string[] = [];
    for (let index = 0; index < a.order.length; index++) {
      for (const file of [a, b]) { const result = await receiver.accept(frameAt(file, index)); if (result.type === 'complete') completed.push(result.progress.metadata.name); }
    }
    expect(completed.sort()).toEqual(['a', 'b']); receiver.clear();
    expect((await receiver.accept(frameAt(a, 0))).type).toBe('progress'); receiver.clear();
  });
  it('ignores damaged headers/payloads, truncation, random/system QR data and invalid UTF-8', async () => {
    const file = await fixture(), original = frameAt(file, 0), receiver = new FileReceiver();
    for (const offset of [4, 20, 27, 40, 80, original.length - 6]) {
      const damaged = original.slice(); damaged[offset]! ^= 0xff;
      expect((await receiver.accept(damaged)).type).toBe('ignored');
    }
    const malformed = original.slice(); malformed[62] = 0xff;
    new DataView(malformed.buffer).setUint32(malformed.length - 4, crc32(malformed.subarray(0, -4)), true);
    expect(() => parseFrame(malformed)).toThrow();
    for (const frame of [original.slice(0, -1), new TextEncoder().encode('https://example.com'), new Uint8Array(10_000)]) expect((await receiver.accept(frame)).type).toBe('ignored');
    receiver.clear();
  });
  it('rejects unsupported geometry/oversized claims and ESI before WASM allocation even with a valid CRC', async () => {
    const file = await fixture(), original = frameAt(file, 0);
    for (const mutate of [(v: DataView) => v.setUint32(20, MAX_FILE_BYTES + 1, true), (v: DataView) => v.setUint16(24, SYMBOL_BYTES + 1, true)]) {
      const changed = original.slice(), view = new DataView(changed.buffer); mutate(view); view.setUint32(changed.length - 4, crc32(changed.subarray(0, -4)), true);
      expect(() => parseFrame(changed)).toThrow();
    }
    const parsed = parseFrame(original); parsed.payload[0] = 1;
    expect(() => parseFrame(encodeFrame(parsed.metadata, parsed.payload))).toThrow();
    parsed.payload.fill(255, 0, 4);
    expect(() => parseFrame(encodeFrame(parsed.metadata, parsed.payload))).toThrow();
  });
  it('does not accept mixed metadata or return a file with a mismatched whole-file hash', async () => {
    const file = await fixture(), receiver = new FileReceiver();
    await receiver.accept(frameAt(file, 0));
    const parsed = parseFrame(frameAt(file, 1)); parsed.metadata.name = 'changed';
    expect((await receiver.accept(encodeFrame(parsed.metadata, parsed.payload))).type).toBe('ignored'); receiver.clear();
    const corrupt = { ...file, metadata: { ...file.metadata, hash: '00'.repeat(32) } };
    let rejected = false;
    for (let index = 0; index < corrupt.order.length; index++) {
      try { const result = await receiver.accept(frameAt(corrupt, index)); expect(result.type).not.toBe('complete'); }
      catch (error) { expect(error).toMatchObject({ code: 'integrity' }); rejected = true; break; }
    }
    expect(rejected).toBe(true); receiver.clear();
  });
  it('bounds send batches and active receive sessions and clears capacity', async () => {
    expect(() => validateBatch([{ size: MAX_FILE_BYTES + 1 }])).toThrow('fileLimit');
    expect(() => validateBatch([{ size: MAX_BATCH_BYTES / 2 }, { size: MAX_BATCH_BYTES / 2 }, { size: 1 }])).toThrow('batchLimit');
    expect(() => validateBatch(Array.from({ length: MAX_FILES + 1 }, () => ({ size: 0 })))).toThrow();
    const receiver = new FileReceiver();
    for (let i = 0; i < MAX_ACTIVE_FILES; i++) await receiver.accept(frameAt(await fixture(String(i)), 0));
    const next = frameAt(await fixture('next'), 0);
    await expect(receiver.accept(next)).rejects.toMatchObject({ code: 'receiveLimit' });
    receiver.clear(); expect((await receiver.accept(next)).type).toBe('progress'); receiver.clear();
  });
  it('restores the full 5 MiB boundary through real source packets', async () => {
    const bytes = new Uint8Array(MAX_FILE_BYTES).fill(213);
    const file = await fixture('max-size.bin', bytes), receiver = new FileReceiver();
    let complete;
    for (let i = 0; i < Math.ceil(bytes.length / SYMBOL_BYTES); i++) {
      const result = await receiver.accept(encodeFrame(file.metadata, file.packets[i]!));
      if (result.type === 'complete') complete = result;
    }
    expect(complete?.bytes).toEqual(bytes); receiver.clear();
  }, 90_000);
  it('preserves completed deduplication and aggregate capacity after a Worker restart', async () => {
    const file = await fixture(), receiver = new FileReceiver();
    receiver.rememberCompleted([file.metadata]);
    expect((await receiver.accept(frameAt(file, 0))).type).toBe('ignored');
    receiver.rememberCompleted(Array.from({ length: MAX_FILES - 1 }, (_, i) => ({ ...file.metadata, id: String(i), size: 0 })));
    await expect(receiver.accept(frameAt(await fixture('next'), 0))).rejects.toMatchObject({ code: 'receiveLimit' });
    receiver.clear();
    receiver.rememberCompleted([{ ...file.metadata, id: 'reserve', size: MAX_BATCH_BYTES }]);
    await expect(receiver.accept(frameAt(file, 0))).rejects.toMatchObject({ code: 'receiveLimit' }); receiver.clear();
  });
  it('sanitizes download paths and truncates names on valid Unicode boundaries', () => {
    expect(safeFilename('../evil\\file\u0000')).toBe('__evil_file_');
    const name = safeFilename('图'.repeat(200));
    expect(new TextEncoder().encode(name).length).toBeLessThanOrEqual(255); expect(name).not.toContain('�');
  });
});
