/** DTF1 compatibility + DTF2 variable symbols; independent of the RaptorQR demo. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BATCH_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 8;
export const MAX_ACTIVE_FILES = 3;
export const SYMBOL_BYTES = 384;
export const TRANSPORT_BYTES = SYMBOL_BYTES + 4;
export const REPAIR_PERCENT = 50;
export const HEADER_BYTES = 62;
export const MAX_SYMBOL_BYTES = 2800;
const MAX_NAME_BYTES = 255;
const MAX_MIME_BYTES = 96;
const MAGIC = [0x44, 0x54, 0x46]; // DTF + ASCII version

export interface FileMetadata { id: string; name: string; mime: string; size: number; hash: string; symbolBytes?: number }
export interface ParsedFrame { metadata: FileMetadata; payload: Uint8Array; symbolId: number }
export type TransferErrorCode = 'fileLimit' | 'batchLimit' | 'invalidFrame' | 'integrity' | 'receiveLimit' | 'engine';
export class TransferError extends Error {
  constructor(public code: TransferErrorCode) { super(code); }
}
export function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}
function unhex(value: string, length: number): Uint8Array {
  if (!new RegExp(`^[a-f0-9]{${length * 2}}$`).test(value)) throw new TransferError('invalidFrame');
  return Uint8Array.from(value.match(/../g)!, (part) => Number.parseInt(part, 16));
}
export async function sha256(bytes: Uint8Array): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}
export function safeFilename(name: string): string {
  const clean = Array.from(name, (character) => character.codePointAt(0)! < 32 || character.codePointAt(0) === 127 ? '_' : character).join('').replace(/[/\\:]/g, '_').replace(/^\.+/, '_').trim() || 'received-file';
  let result = '';
  for (const character of clean) {
    if (new TextEncoder().encode(result + character).length > MAX_NAME_BYTES) break;
    result += character;
  }
  return result;
}
export function safeMime(mime: string): string {
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(mime) && mime.length <= MAX_MIME_BYTES
    ? mime.toLowerCase() : 'application/octet-stream';
}
export function validateBatch(files: readonly Pick<File, 'size'>[]): void {
  if (files.some((file) => !Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES)) throw new TransferError('fileLimit');
  if (!files.length || files.length > MAX_FILES || files.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_BYTES) throw new TransferError('batchLimit');
}
export function symbolBytes(metadata: FileMetadata): number { return metadata.symbolBytes ?? SYMBOL_BYTES; }
export function validSymbolSize(size: number): boolean { return Number.isInteger(size) && size >= SYMBOL_BYTES && size <= MAX_SYMBOL_BYTES && size % 4 === 0; }
export function sourceCount(size: number, symbolSize = SYMBOL_BYTES): number { return Math.max(1, Math.ceil(size / symbolSize)); }
export function packetCount(size: number, symbolSize = SYMBOL_BYTES): number {
  const count = sourceCount(size, symbolSize);
  return count + Math.ceil(count * REPAIR_PERCENT / 100);
}
// CRC protects frame/header corruption before any decoder allocation; SHA-256 checks the complete file.
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function encodeFrame(metadata: FileMetadata, payload: Uint8Array): Uint8Array {
  const name = new TextEncoder().encode(metadata.name);
  const mime = new TextEncoder().encode(metadata.mime);
  const symbolSize = symbolBytes(metadata);
  if (!validSymbolSize(symbolSize) || name.length === 0 || name.length > MAX_NAME_BYTES || mime.length > MAX_MIME_BYTES || payload.length !== symbolSize + 4) throw new TransferError('invalidFrame');
  const bytes = new Uint8Array(HEADER_BYTES + name.length + mime.length + payload.length + 4);
  const view = new DataView(bytes.buffer);
  bytes.set(MAGIC); bytes[3] = symbolSize === SYMBOL_BYTES ? 0x31 : 0x32; bytes.set(unhex(metadata.id, 16), 4);
  view.setUint32(20, metadata.size, true);
  view.setUint16(24, symbolSize, true);
  view.setUint16(26, name.length, true); view.setUint16(28, mime.length, true);
  bytes.set(unhex(metadata.hash, 32), 30);
  bytes.set(name, HEADER_BYTES); bytes.set(mime, HEADER_BYTES + name.length);
  bytes.set(payload, HEADER_BYTES + name.length + mime.length);
  view.setUint32(bytes.length - 4, crc32(bytes.subarray(0, -4)), true);
  return bytes;
}
export function parseFrame(bytes: Uint8Array): ParsedFrame {
  if (bytes.length < HEADER_BYTES + TRANSPORT_BYTES + 5 || bytes.length > HEADER_BYTES + MAX_NAME_BYTES + MAX_MIME_BYTES + MAX_SYMBOL_BYTES + 8 || MAGIC.some((value, i) => bytes[i] !== value) || (bytes[3] !== 0x31 && bytes[3] !== 0x32)) throw new TransferError('invalidFrame');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(bytes.length - 4, true) !== crc32(bytes.subarray(0, -4))) throw new TransferError('invalidFrame');
  const size = view.getUint32(20, true), symbolSize = view.getUint16(24, true);
  const nameLength = view.getUint16(26, true), mimeLength = view.getUint16(28, true);
  if (size > MAX_FILE_BYTES || !validSymbolSize(symbolSize) || (bytes[3] === 0x31 && symbolSize !== SYMBOL_BYTES) || !nameLength || nameLength > MAX_NAME_BYTES || mimeLength > MAX_MIME_BYTES || bytes.length !== HEADER_BYTES + nameLength + mimeLength + symbolSize + 8) throw new TransferError('invalidFrame');
  let name: string, mime: string;
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    name = decoder.decode(bytes.subarray(HEADER_BYTES, HEADER_BYTES + nameLength));
    mime = decoder.decode(bytes.subarray(HEADER_BYTES + nameLength, HEADER_BYTES + nameLength + mimeLength));
  } catch { throw new TransferError('invalidFrame'); }
  if (safeFilename(name) !== name || safeMime(mime) !== mime) throw new TransferError('invalidFrame');
  const payload = bytes.slice(HEADER_BYTES + nameLength + mimeLength, -4);
  const symbolId = (payload[1]! << 16) | (payload[2]! << 8) | payload[3]!;
  // All supported geometries within 5 MiB fit one RaptorQ source block. Bound attacker-controlled ESI before WASM.
  if (payload[0] !== 0 || symbolId >= packetCount(size, symbolSize)) throw new TransferError('invalidFrame');
  return { metadata: { id: hex(bytes.subarray(4, 20)), size, name, mime, hash: hex(bytes.subarray(30, 62)), ...(symbolSize !== SYMBOL_BYTES ? { symbolBytes: symbolSize } : {}) }, payload, symbolId };
}
