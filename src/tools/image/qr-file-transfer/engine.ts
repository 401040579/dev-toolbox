import { transferGeometry, type TransferProfile } from './profiles';
import { encode_packets, RaptorQDecoder } from '@raptorqr/raptorq-wasm';
import { encodeFrame, parseFrame, safeFilename, safeMime, sha256, hex, sourceCount, packetCount, symbolBytes, REPAIR_PERCENT, SYMBOL_BYTES, MAX_BATCH_BYTES, MAX_FILES, MAX_ACTIVE_FILES, TransferError, type FileMetadata } from './protocol';

export interface PreparedFile { metadata: FileMetadata; packets: Uint8Array[]; order: number[] }
export interface ReceiveProgress { metadata: FileMetadata; received: number; expected: number; uniqueBytes: number; elapsedMs: number }
export type ReceiveOutcome = { type: 'ignored' } | { type: 'progress'; progress: ReceiveProgress } | { type: 'complete'; progress: ReceiveProgress; bytes: Uint8Array };

export async function prepareFile(file: File, profile: TransferProfile = 'compatible'): Promise<PreparedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const metadata = { id: hex(crypto.getRandomValues(new Uint8Array(16))), name: safeFilename(file.name), mime: safeMime(file.type), size: bytes.length, hash: await sha256(bytes) };
  const geometry = transferGeometry(metadata, profile);
  const sizedMetadata: FileMetadata = { ...metadata, ...(geometry.symbolBytes !== SYMBOL_BYTES ? { symbolBytes: geometry.symbolBytes } : {}) };
  const packets = encode_packets(bytes.length ? bytes : new Uint8Array([0]), geometry.symbolBytes + 4, REPAIR_PERCENT).map((packet: Uint8Array) => new Uint8Array(packet));
  if (packets.length !== packetCount(bytes.length, geometry.symbolBytes)) throw new TransferError('engine');
  const sources = sourceCount(bytes.length, geometry.symbolBytes);
  // Interleave recovery symbols from the first pass instead of postponing all recovery to the end.
  const order: number[] = [];
  for (let i = 0; i < sources; i++) {
    order.push(i);
    if (i % 2 === 0 && sources + Math.floor(i / 2) < packets.length) order.push(sources + Math.floor(i / 2));
  }
  return { metadata: sizedMetadata, packets, order };
}
export function frameAt(file: PreparedFile, index: number): Uint8Array {
  return encodeFrame(file.metadata, file.packets[file.order[index]!]!);
}
interface Session { metadata: FileMetadata; decoder: RaptorQDecoder; seen: Set<number>; started: number }

/** All allocations have file/count/aggregate limits. Worker termination also frees the WASM heap. */
export class FileReceiver {
  private active = new Map<string, Session>();
  private completed = new Set<string>();
  private reservedBytes = 0;
  private completedBytes = 0;
  rememberCompleted(files: FileMetadata[]): void {
    for (const file of files) {
      if (this.completed.has(file.id)) continue;
      if (this.completed.size >= MAX_FILES || this.completedBytes + file.size > MAX_BATCH_BYTES) throw new TransferError('receiveLimit');
      this.completed.add(file.id); this.completedBytes += file.size;
    }
  }
  async accept(frame: Uint8Array): Promise<ReceiveOutcome> {
    let parsed;
    try { parsed = parseFrame(frame); } catch { return { type: 'ignored' }; }
    const { metadata, payload, symbolId } = parsed;
    if (this.completed.has(metadata.id)) return { type: 'ignored' };
    let session = this.active.get(metadata.id);
    if (!session) {
      if (this.active.size >= MAX_ACTIVE_FILES || this.active.size + this.completed.size >= MAX_FILES || this.reservedBytes + this.completedBytes + metadata.size > MAX_BATCH_BYTES) throw new TransferError('receiveLimit');
      session = { metadata, decoder: new RaptorQDecoder(Math.max(1, metadata.size), symbolBytes(metadata) + 4), seen: new Set(), started: performance.now() };
      this.active.set(metadata.id, session);
      this.reservedBytes += metadata.size;
    }
    if (JSON.stringify(session.metadata) !== JSON.stringify(metadata) || session.seen.has(symbolId)) return { type: 'ignored' };
    session.seen.add(symbolId);
    const progress = { metadata, received: session.seen.size, expected: sourceCount(metadata.size, symbolBytes(metadata)), uniqueBytes: session.seen.size * symbolBytes(metadata), elapsedMs: performance.now() - session.started };
    let decoded: Uint8Array | undefined;
    try { decoded = session.decoder.push(payload) as Uint8Array | undefined; }
    catch { this.remove(metadata.id); throw new TransferError('engine'); }
    if (!decoded) return { type: 'progress', progress };
    try {
      const bytes = new Uint8Array(decoded).slice(0, metadata.size);
      if (decoded.length !== Math.max(1, metadata.size) || await sha256(bytes) !== metadata.hash) throw new TransferError('integrity');
      this.completed.add(metadata.id); this.completedBytes += metadata.size;
      return { type: 'complete', progress: { ...progress, elapsedMs: performance.now() - session.started }, bytes };
    } finally { this.remove(metadata.id); }
  }
  private remove(id: string): void {
    const session = this.active.get(id);
    if (session) { session.decoder.free(); this.reservedBytes -= session.metadata.size; this.active.delete(id); }
  }
  clear(): void { for (const id of this.active.keys()) this.remove(id); this.completed.clear(); this.completedBytes = 0; }
}
