import initRaptorQ from '@raptorqr/raptorq-wasm';
import raptorWasmUrl from '@raptorqr/raptorq-wasm/wasm/raptorqr_raptorq_wasm_bg.wasm?url';
import { prepareZXingModule } from 'zxing-wasm/reader';
import readerWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import QRCode from 'qrcode';
import { isProfile, transferGeometry, nextBoard, type TransferProfile, type PlaybackPosition, type ParallelCodes } from '@/tools/image/qr-file-transfer/profiles';
import { symbolBytes } from '@/tools/image/qr-file-transfer/protocol';
import { scanPixels, type ScannerModule } from '@/tools/image/qr-file-transfer/scanner';
import { prepareFile, frameAt, FileReceiver, type PreparedFile } from '@/tools/image/qr-file-transfer/engine';
import { validateBatch, TransferError, type FileMetadata } from '@/tools/image/qr-file-transfer/protocol';

let files: PreparedFile[] = [];
let profile: TransferProfile = 'compatible';
let scanCount = 0;
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
export type QrWorkerRequest = { type: 'prepare'; files: File[]; profile?: TransferProfile } | { type: 'boards'; position: PlaybackPosition; parallel: ParallelCodes; count: number } | { type: 'frame'; file: number; index: number } | { type: 'initReceiver'; completed: FileMetadata[]; generation: number } | { type: 'scan'; generation: number; rgba: Uint8ClampedArray; width: number; height: number; robust?: boolean } | { type: 'clear' };
// Serialized work prevents concurrent frames/digests from re-entering a decoder or double-completing.
self.onmessage = (event: MessageEvent<QrWorkerRequest>) => {
  chain = chain.then(async () => {
    const request = event.data;
    try {
      if (request.type === 'prepare') {
        validateBatch(request.files);
        if (request.profile !== undefined && !isProfile(request.profile)) throw new TransferError('engine');
        profile = request.profile ?? 'compatible'; await initialize(false);
        files = [];
        for (const file of request.files) files.push(await prepareFile(file, profile));
        self.postMessage({ type: 'prepared', files: files.map((file) => ({ metadata: file.metadata, frames: file.order.length, symbolBytes: symbolBytes(file.metadata) })) });
      } else if (request.type === 'boards') {
        if (![1, 2, 4].includes(request.parallel) || !Number.isInteger(request.count) || request.count < 1 || request.count > 4) throw new TransferError('engine');
        let position = request.position;
        const boards = [], buffers: ArrayBuffer[] = [];
        for (let i = 0; i < request.count; i++) {
          const file = files[position.file];
          if (!file || !Number.isSafeInteger(position.pass) || position.pass < 1 || !Number.isInteger(position.index) || position.index < 0 || position.index >= file.order.length) throw new TransferError('engine');
          const board = nextBoard(position, files.map((entry) => entry.order.length), request.parallel);
          const codes = board.positions.map((slot) => {
            const matrix = QRCode.create([{ data: frameAt(file, slot.index, slot.pass), mode: 'byte' }], transferGeometry(file.metadata, profile)).modules;
            buffers.push(matrix.data.buffer as ArrayBuffer);
            return { modules: matrix.data, size: matrix.size };
          });
          boards.push({ position, codes, payloadBytes: codes.length * symbolBytes(file.metadata) });
          position = board.next;
        }
        self.postMessage({ type: 'boards', boards, next: position }, { transfer: buffers });
      } else if (request.type === 'frame') {
        const file = files[request.file];
        if (!file || !Number.isInteger(request.index) || request.index < 0 || request.index >= file.order.length) throw new TransferError('engine');
        const matrix = QRCode.create([{ data: frameAt(file, request.index), mode: 'byte' }], transferGeometry(file.metadata, profile)).modules;
        self.postMessage({ type: 'frame', modules: matrix.data, size: matrix.size }, { transfer: [matrix.data.buffer as ArrayBuffer] });
      } else if (request.type === 'initReceiver') {
        await initialize(true); receiver.rememberCompleted(request.completed); self.postMessage({ type: 'ready', generation: request.generation });
      } else if (request.type === 'scan') {
        if (request.width <= 0 || request.height <= 0 || request.width > 1920 || request.height > 1920 || request.rgba.length !== request.width * request.height * 4) throw new TransferError('engine');
        if (!scanner) throw new TransferError('engine');
        const started = performance.now();
        // Periodic robust pass recovers rotation/inversion without paying its cost on every frame.
        const results = scanPixels(scanner, { data: request.rgba, width: request.width, height: request.height }, request.robust === true || ++scanCount % 15 === 0);
        for (const bytes of results) {
          const outcome = await receiver.accept(bytes);
          if (outcome.type === 'complete') self.postMessage(outcome, { transfer: [outcome.bytes.buffer as ArrayBuffer] });
          else if (outcome.type === 'progress') self.postMessage(outcome);
        }
        self.postMessage({ type: 'scanned', generation: request.generation, symbols: results.length, decodeMs: performance.now() - started });
      } else if (request.type === 'clear') {
        receiver.clear(); self.postMessage({ type: 'cleared' });
      }
    } catch (error) {
      self.postMessage({ type: 'error', code: error instanceof TransferError ? error.code : 'engine' });
    }
  });
};
