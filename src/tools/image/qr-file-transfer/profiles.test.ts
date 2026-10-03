import { beforeAll, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { initSync } from '@raptorqr/raptorq-wasm';
import QRCode from 'qrcode';
import { prepareFile, frameAt, FileReceiver } from './engine';
import { parseFrame, crc32, symbolBytes, safeFilename, safeMime } from './protocol';
import { profiles, transferGeometry, nextBoard } from './profiles';

beforeAll(() => initSync({ module: readFileSync('node_modules/@raptorqr/raptorq-wasm/src/wasm/raptorqr_raptorq_wasm_bg.wasm') }));
it.each(['high', 'extreme'] as const)('%s geometry fits the longest UTF-8 name/MIME and recovers with losses', async (profile) => {
  const bytes = crypto.getRandomValues(new Uint8Array(61_001));
  const name = safeFilename('图'.repeat(100)), mime = safeMime(`application/${'x'.repeat(84)}`);
  const prepared = await prepareFile(new File([bytes], name, { type: mime }), profile);
  const receiver = new FileReceiver();
  let complete;
  for (let i = 0; i < prepared.order.length; i++) {
    const frame = frameAt(prepared, i);
    expect(frame.length).toBeLessThanOrEqual(profiles[profile].capacity);
    const qr = QRCode.create([{ data: frame, mode: 'byte' }], { version: profiles[profile].version, errorCorrectionLevel: 'L' });
    expect(qr.modules.size).toBe(profile === 'high' ? 137 : 177);
    expect(parseFrame(frame).metadata).toEqual(prepared.metadata);
    if (i % 5 !== 0) { const result = await receiver.accept(frame); if (result.type === 'complete') complete = result; }
  }
  expect(complete?.bytes).toEqual(bytes); expect(symbolBytes(prepared.metadata) % 4).toBe(0);
  receiver.clear();
});
it('rejects illegal DTF2 geometry even with a valid CRC; preserves DTF1 bytes', async () => {
  const file = new File([new Uint8Array(8000)], 'test.bin');
  const old = frameAt(await prepareFile(file), 0); expect(old[3]).toBe(0x31); expect(parseFrame(old).metadata.symbolBytes).toBeUndefined();
  const fast = frameAt(await prepareFile(file, 'extreme'), 0); expect(fast[3]).toBe(0x32);
  for (const size of [0, 383, 385, 2804, 65535]) {
    const changed = fast.slice(), view = new DataView(changed.buffer);
    view.setUint16(24, size, true); view.setUint32(changed.length - 4, crc32(changed.subarray(0, -4)), true);
    expect(() => parseFrame(changed)).toThrow();
  }
  const relabeled = fast.slice(); relabeled[3] = 0x31;
  new DataView(relabeled.buffer).setUint32(relabeled.length - 4, crc32(relabeled.subarray(0, -4)), true);
  expect(() => parseFrame(relabeled)).toThrow();
});
it('budgets metadata and never mixes files on a parallel board', () => {
  expect(transferGeometry({ name: 'data.bin', mime: 'application/octet-stream' }, 'high').symbolBytes).toBe(1600);
  expect(transferGeometry({ name: 'data.bin', mime: 'application/octet-stream' }, 'extreme').symbolBytes).toBe(2800);
  expect(nextBoard({ file: 0, index: 4, pass: 1 }, [5, 7], 4)).toEqual({ positions: [{ file: 0, index: 4, pass: 1 }], next: { file: 1, index: 0, pass: 1 } });
  expect(nextBoard({ file: 1, index: 4, pass: 2 }, [5, 7], 4).next).toEqual({ file: 0, index: 0, pass: 3 });
});

it('shifts repeated boards to break fixed every-other-board camera aliasing', async () => {
  const bytes = crypto.getRandomValues(new Uint8Array(25_600));
  const file = await prepareFile(new File([bytes], 'alias.bin'), 'high'), receiver = new FileReceiver();
  expect(file.order).toHaveLength(24); // Six four-code boards: a half-rate camera can lock to three of them.
  let complete;
  for (let pass = 1; pass <= 4 && !complete; pass++) {
    for (let index = 0; index < file.order.length; index++) {
      if (Math.floor(index / 4) % 2 === 1) continue;
      const result = await receiver.accept(frameAt(file, index, pass));
      if (result.type === 'complete') complete = result;
    }
    if (pass === 1) expect(complete).toBeUndefined();
  }
  expect(complete).toBeDefined();
  expect(complete?.bytes).toEqual(bytes); receiver.clear();
});
