import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import QRCode from 'qrcode';
import { prepareZXingModule } from 'zxing-wasm/reader';
import { scanPixels, type ScannerModule } from './scanner';

let reader: ScannerModule;
beforeAll(async () => { reader = await prepareZXingModule({ overrides: { wasmBinary: readFileSync('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm') }, fireImmediately: true }) as ScannerModule; });
describe('real QR rendering and ZXing raw-byte scanning', () => {
  it('preserves all byte values through QR pixels, not string decoding', () => {
    const bytes = Uint8Array.from({ length: 512 }, (_, index) => index % 256);
    const qr = QRCode.create([{ data: bytes, mode: 'byte' }], { errorCorrectionLevel: 'M' }).modules;
    const width = (qr.size + 8) * 4, data = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.data[y * qr.size + x]) {
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) { const offset = (((y + 4) * 4 + dy) * width + (x + 4) * 4 + dx) * 4; data.fill(0, offset, offset + 3); }
    }
    const image = { data, width, height: width };
    expect(scanPixels(reader, image)).toEqual([bytes]);
    // A camera loop must release vectors, not just pixel buffers. Check the real Embind delete path.
    const original = reader.readBarcodesFromPixmap.bind(reader);
    let releases = 0;
    const spy = vi.spyOn(reader, 'readBarcodesFromPixmap').mockImplementation((...args) => {
      const result = original(...args) as ReturnType<typeof original> & { delete(): void };
      const release = result.delete.bind(result); result.delete = () => { releases++; release(); };
      return result;
    });
    for (let i = 0; i < 30; i++) expect(scanPixels(reader, image)[0]).toEqual(bytes);
    expect(releases).toBe(30); spy.mockRestore();
  });
  it('releases pixels when decoding fails', () => {
    const free = vi.spyOn(reader, '_free');
    const read = vi.spyOn(reader, 'readBarcodesFromPixmap').mockImplementation(() => { throw new Error('decoder'); });
    expect(() => scanPixels(reader, { data: new Uint8ClampedArray(400), width: 10, height: 10 })).toThrow('decoder');
    expect(free).toHaveBeenCalledOnce(); read.mockRestore(); free.mockRestore();
  });
});
