import type { ToolDefinition } from '@/tools/types';

// Crockford's Base32 alphabet
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

// Generate a ULID
export function generateULID(): string {
  const now = Date.now();
  return encodeTime(now, TIME_LEN) + encodeRandom(RANDOM_LEN);
}

// Generate multiple ULIDs
export function generateULIDs(count: number): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateULID());
  }
  return results;
}

// Encode timestamp to Crockford's Base32
function encodeTime(now: number, len: number): string {
  let str = '';
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING[mod]! + str;
    now = Math.floor(now / ENCODING_LEN);
  }
  return str;
}

// Encode random bytes to Crockford's Base32
function encodeRandom(len: number): string {
  let str = '';
  const randomValues = new Uint8Array(len);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < len; i++) {
    str += ENCODING[randomValues[i]! % ENCODING_LEN]!;
  }
  return str;
}

// Parse ULID to extract timestamp
export function parseULID(ulid: string): { timestamp: number; date: Date } | null {
  if (!isValidULID(ulid)) return null;

  const timeStr = ulid.slice(0, TIME_LEN).toUpperCase();
  let timestamp = 0;

  for (let i = 0; i < TIME_LEN; i++) {
    const char = timeStr[i]!;
    const idx = ENCODING.indexOf(char);
    if (idx === -1) return null;
    timestamp = timestamp * ENCODING_LEN + idx;
  }

  return {
    timestamp,
    date: new Date(timestamp),
  };
}

// Validate ULID format
export function isValidULID(ulid: string): boolean {
  if (ulid.length !== 26) return false;

  const upperUlid = ulid.toUpperCase();
  for (const char of upperUlid) {
    if (!ENCODING.includes(char)) {
      // Also allow lowercase equivalents
      if (!'ILOU'.includes(char)) {
        return false;
      }
    }
  }

  return true;
}

const tool: ToolDefinition = {
  id: 'ulid',
  name: 'ULID Generator',
  description: 'Generate Universally Unique Lexicographically Sortable Identifiers',
  category: 'generators',
  keywords: ['ulid', 'uuid', 'unique', 'id', 'identifier', 'sortable'],
  icon: 'Hash',
  component: () => import('./UlidGenerator'),
};

export default tool;
