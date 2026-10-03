import { encodeFormats, type ZXingReaderModule, type ZXingReadResult, type ZXingVector, type ZXingReaderOptions } from 'zxing-wasm/reader';
export type ScannerModule = ZXingReaderModule & { HEAPU8: Uint8Array; _malloc(size: number): number; _free(pointer: number): void };
const options: ZXingReaderOptions = {
  formats: encodeFormats(['QRCode']), tryHarder: true, tryRotate: true, tryInvert: true,
  tryDownscale: true, tryDenoise: false, binarizer: 0, isPure: false,
  downscaleThreshold: 500, downscaleFactor: 3, minLineCount: 2, maxNumberOfSymbols: 4,
  validateOptionalChecksum: false, returnErrors: false, eanAddOnSymbol: 0,
  textMode: 0, characterSet: 0, tryCode39ExtendedMode: true,
};
/** Explicitly release both the pixel allocation and Embind result vector on every camera frame. */
export function scanPixels(reader: ScannerModule, image: { data: Uint8ClampedArray; width: number; height: number }, robust = true): Uint8Array[] {
  const gray = new Uint8Array(image.width * image.height);
  if (image.data.length !== gray.length * 4) throw new Error('Invalid camera frame');
  for (let i = 0; i < gray.length; i++) gray[i] = (306 * image.data[i * 4]! + 601 * image.data[i * 4 + 1]! + 117 * image.data[i * 4 + 2]! + 512) >> 10;
  const pointer = reader._malloc(gray.length);
  if (!pointer) throw new Error('Unable to allocate camera frame');
  let results: (ZXingVector<ZXingReadResult> & { delete(): void }) | undefined;
  try {
    reader.HEAPU8.set(gray, pointer);
    results = reader.readBarcodesFromPixmap(pointer, image.width, image.height, robust ? options : { ...options, tryHarder: false, tryRotate: false, tryInvert: false }) as typeof results;
    const bytes: Uint8Array[] = [];
    for (let i = 0; i < results!.size(); i++) {
      const result = results!.get(i);
      if (result?.isValid && result.symbology === 'QRCode' && result.bytes.length) bytes.push(new Uint8Array(result.bytes));
    }
    return bytes;
  } finally { try { results?.delete(); } finally { reader._free(pointer); } }
}
