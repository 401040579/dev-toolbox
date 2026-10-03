import initRaptorQ from '@raptorqr/raptorq-wasm';
import raptorWasmUrl from '@raptorqr/raptorq-wasm/wasm/raptorqr_raptorq_wasm_bg.wasm?url';
import { prepareZXingModule } from 'zxing-wasm/reader';
import readerWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import QRCode from 'qrcode';
import { scanPixels, type ScannerModule } from '@/tools/image/qr-file-transfer/scanner';
import { prepareFile, frameAt, FileReceiver, type PreparedFile } from '@/tools/image/qr-file-transfer/engine';
import { validateBatch, TransferError, type FileMetadata } from '@/tools/image/qr-file-transfer/protocol';

let files: PreparedFile[] = [];
let scanner: ScannerModule | undefined;
const receiver = new FileReceiver();
let initialized: Promise<unknown> | undefined;
const scannerOverrides = { locateFile: (path: string) => path.endsWith('.wasm') ? readerWasmUrl : path };
let chain = Promise.resolve();
async function initialize(needsScanner: boolean) {
  initialized ??= initRaptorQ({ module_or_path: raptorWasmUrl });
  await initialized;
  if (needsScanner) scanner = await prepareZXingModule({ overrides: scannerOverrides, fireImmediately: true }) as ScannerModule;
}
export type QrWorkerRequest = { type: 'prepare'; files: File[] } | { type: 'frame'; file: number; index: number } | { type: 'initReceiver'; completed: FileMetadata[]; generation: number } | { type: 'scan'; generation: number; rgba: Uint8ClampedArray; width: number; height: number } | { type: 'clear' };
// Serialized work prevents concurrent frames/digests from re-entering a decoder or double-completing.
self.onmessage = (event: MessageEvent<QrWorkerRequest>) => {
  chain = chain.then(async () => {
    const request = event.data;
    try {
      if (request.type === 'prepare') {
        validateBatch(request.files); await initialize(false);
        files = [];
        for (const file of request.files) files.push(await prepareFile(file));
        self.postMessage({ type: 'prepared', files: files.map((file) => ({ metadata: file.metadata, frames: file.order.length })) });
      } else if (request.type === 'frame') {
        const file = files[request.file];
        if (!file || !Number.isInteger(request.index) || request.index < 0 || request.index >= file.order.length) throw new TransferError('engine');
        const matrix = QRCode.create([{ data: frameAt(file, request.index), mode: 'byte' }], { errorCorrectionLevel: 'M' }).modules;
        self.postMessage({ type: 'frame', modules: matrix.data, size: matrix.size }, { transfer: [matrix.data.buffer as ArrayBuffer] });
      } else if (request.type === 'initReceiver') {
        await initialize(true); receiver.rememberCompleted(request.completed); self.postMessage({ type: 'ready', generation: request.generation });
      } else if (request.type === 'scan') {
        if (request.width <= 0 || request.height <= 0 || request.width > 1280 || request.height > 1280 || request.rgba.length !== request.width * request.height * 4) throw new TransferError('engine');
        if (!scanner) throw new TransferError('engine');
        const results = scanPixels(scanner, { data: request.rgba, width: request.width, height: request.height });
        for (const bytes of results) {
          const outcome = await receiver.accept(bytes);
          if (outcome.type === 'complete') self.postMessage(outcome, { transfer: [outcome.bytes.buffer as ArrayBuffer] });
          else if (outcome.type === 'progress') self.postMessage(outcome);
        }
        self.postMessage({ type: 'scanned', generation: request.generation });
      } else if (request.type === 'clear') {
        receiver.clear(); self.postMessage({ type: 'cleared' });
      }
    } catch (error) {
      self.postMessage({ type: 'error', code: error instanceof TransferError ? error.code : 'engine' });
    }
  });
};
