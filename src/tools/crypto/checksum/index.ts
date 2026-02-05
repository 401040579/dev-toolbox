import type { ToolDefinition } from '@/tools/types';

// CRC32 implementation
const CRC32_TABLE: number[] = [];
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

export function crc32(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

// Adler-32 implementation
export function adler32(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;

  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]!) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  return ((b << 16) | a).toString(16).padStart(8, '0').toUpperCase();
}

// CRC16 (CCITT) implementation
const CRC16_TABLE: number[] = [];
for (let i = 0; i < 256; i++) {
  let crc = 0;
  let c = i << 8;
  for (let j = 0; j < 8; j++) {
    if ((crc ^ c) & 0x8000) {
      crc = (crc << 1) ^ 0x1021;
    } else {
      crc = crc << 1;
    }
    c = c << 1;
  }
  CRC16_TABLE[i] = crc & 0xffff;
}

export function crc16(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let crc = 0xffff;

  for (let i = 0; i < bytes.length; i++) {
    crc = ((crc << 8) ^ CRC16_TABLE[((crc >> 8) ^ bytes[i]!) & 0xff]!) & 0xffff;
  }

  return crc.toString(16).padStart(4, '0').toUpperCase();
}

const tool: ToolDefinition = {
  id: 'checksum',
  name: 'Checksum Calculator',
  description: 'Calculate CRC32, CRC16, and Adler-32 checksums',
  category: 'crypto',
  keywords: ['checksum', 'crc32', 'crc16', 'adler32', 'hash', 'verify'],
  icon: 'ShieldCheck',
  component: () => import('./Checksum'),
  transforms: [
    {
      id: 'crc32',
      name: 'CRC32',
      description: 'Calculate CRC32 checksum',
      inputType: 'string',
      outputType: 'string',
      transform: (s: string) => crc32(s),
    },
    {
      id: 'crc16',
      name: 'CRC16',
      description: 'Calculate CRC16 checksum',
      inputType: 'string',
      outputType: 'string',
      transform: (s: string) => crc16(s),
    },
    {
      id: 'adler32',
      name: 'Adler-32',
      description: 'Calculate Adler-32 checksum',
      inputType: 'string',
      outputType: 'string',
      transform: (s: string) => adler32(s),
    },
  ],
};

export default tool;
