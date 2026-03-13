import type { ToolDefinition } from '@/tools/types';

export type ByteUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'KiB' | 'MiB' | 'GiB' | 'TiB' | 'PiB';

interface UnitInfo {
  label: string;
  bytes: number;
  binary: boolean;
}

export const BYTE_UNITS: Record<ByteUnit, UnitInfo> = {
  B: { label: 'Bytes', bytes: 1, binary: false },
  KB: { label: 'Kilobytes (KB)', bytes: 1000, binary: false },
  MB: { label: 'Megabytes (MB)', bytes: 1e6, binary: false },
  GB: { label: 'Gigabytes (GB)', bytes: 1e9, binary: false },
  TB: { label: 'Terabytes (TB)', bytes: 1e12, binary: false },
  PB: { label: 'Petabytes (PB)', bytes: 1e15, binary: false },
  KiB: { label: 'Kibibytes (KiB)', bytes: 1024, binary: true },
  MiB: { label: 'Mebibytes (MiB)', bytes: 1048576, binary: true },
  GiB: { label: 'Gibibytes (GiB)', bytes: 1073741824, binary: true },
  TiB: { label: 'Tebibytes (TiB)', bytes: 1099511627776, binary: true },
  PiB: { label: 'Pebibytes (PiB)', bytes: 1125899906842624, binary: true },
};

export function convertBytes(value: number, from: ByteUnit, to: ByteUnit): number {
  const bytes = value * BYTE_UNITS[from].bytes;
  return bytes / BYTE_UNITS[to].bytes;
}

export function convertToAll(value: number, from: ByteUnit): Record<ByteUnit, string> {
  const result = {} as Record<ByteUnit, string>;
  const bytes = value * BYTE_UNITS[from].bytes;
  for (const [unit, info] of Object.entries(BYTE_UNITS)) {
    const converted = bytes / info.bytes;
    result[unit as ByteUnit] = converted < 0.01 && converted > 0
      ? converted.toExponential(2)
      : converted.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }
  return result;
}

const tool: ToolDefinition = {
  id: 'byte-converter',
  name: 'Byte Size Converter',
  description: 'Convert between bytes, KB, MB, GB, TB and binary units',
  category: 'math',
  keywords: ['byte', 'size', 'convert', 'kb', 'mb', 'gb', 'tb', 'binary', 'kibibyte'],
  icon: 'HardDrive',
  component: () => import('./ByteConverter'),
};

export default tool;
