import { HEADER_BYTES, SYMBOL_BYTES, type FileMetadata } from './protocol';

export const profiles = {
  compatible: { version: undefined, ecc: 'M', targetBytes: SYMBOL_BYTES, capacity: 0 },
  high: { version: 30, ecc: 'L', targetBytes: 1600, capacity: 1732 },
  extreme: { version: 40, ecc: 'L', targetBytes: 2800, capacity: 2953 },
} as const;
export type TransferProfile = keyof typeof profiles;
export type ParallelCodes = 1 | 2 | 4;
export function isProfile(value: unknown): value is TransferProfile { return typeof value === 'string' && Object.prototype.hasOwnProperty.call(profiles, value); }
/** Reserve the complete bounded UTF-8 envelope before selecting a 4-byte-aligned RaptorQ symbol. */
export function transferGeometry(metadata: Pick<FileMetadata, 'name' | 'mime'>, profile: TransferProfile) {
  const spec = profiles[profile];
  const overhead = HEADER_BYTES + new TextEncoder().encode(metadata.name).length + new TextEncoder().encode(metadata.mime).length + 8;
  const symbolBytes = profile === 'compatible' ? SYMBOL_BYTES : Math.floor(Math.min(spec.targetBytes, spec.capacity - overhead) / 4) * 4;
  return { symbolBytes, version: spec.version, errorCorrectionLevel: spec.ecc };
}

export interface PlaybackPosition { file: number; index: number; pass: number }
/** Keep each board within one file: never create >3 active receivers from an 8-file batch. */
export function nextBoard(position: PlaybackPosition, counts: readonly number[], parallel: ParallelCodes) {
  const remaining = counts[position.file]! - position.index;
  const count = Math.min(parallel, remaining);
  const positions = Array.from({ length: count }, (_, i) => ({ ...position, index: position.index + i }));
  const next = { ...position, index: position.index + count };
  if (next.index >= counts[next.file]!) { next.index = 0; next.file++; }
  if (next.file >= counts.length) { next.file = 0; next.pass++; }
  return { positions, next };
}
