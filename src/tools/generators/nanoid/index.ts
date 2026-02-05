import type { ToolDefinition } from '@/tools/types';

// Default alphabet for NanoID
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
const URL_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict';
const HEX_ALPHABET = '0123456789abcdef';
const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export type NanoIdType = 'default' | 'url-safe' | 'hex' | 'alphanumeric' | 'custom';

export interface NanoIdOptions {
  type: NanoIdType;
  size: number;
  customAlphabet?: string;
}

// Generate a NanoID
export function generateNanoId(options: Partial<NanoIdOptions> = {}): string {
  const { type = 'default', size = 21, customAlphabet } = options;

  let alphabet: string;
  switch (type) {
    case 'url-safe':
      alphabet = URL_ALPHABET;
      break;
    case 'hex':
      alphabet = HEX_ALPHABET;
      break;
    case 'alphanumeric':
      alphabet = ALPHANUMERIC;
      break;
    case 'custom':
      alphabet = customAlphabet || ALPHABET;
      break;
    default:
      alphabet = ALPHABET;
  }

  // Generate random bytes
  const randomBytes = new Uint8Array(size);
  crypto.getRandomValues(randomBytes);

  let id = '';
  const mask = (2 << Math.log2(alphabet.length - 1)) - 1;
  const step = Math.ceil((1.6 * mask * size) / alphabet.length);

  let i = 0;
  while (id.length < size) {
    const bytes = new Uint8Array(step);
    crypto.getRandomValues(bytes);

    for (let j = 0; j < step && id.length < size; j++) {
      const byte = bytes[j]! & mask;
      if (byte < alphabet.length) {
        id += alphabet[byte];
      }
    }

    i++;
    if (i > 100) break; // Safety limit
  }

  return id;
}

// Generate multiple NanoIDs
export function generateNanoIds(count: number, options: Partial<NanoIdOptions> = {}): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateNanoId(options));
  }
  return results;
}

// Calculate collision probability
export function calculateCollisionProbability(alphabet: string, size: number, count: number): number {
  // Using birthday paradox approximation
  const possibilities = Math.pow(alphabet.length, size);
  if (possibilities === Infinity) return 0;

  // P(collision) ≈ 1 - e^(-n(n-1)/(2N))
  const exponent = -(count * (count - 1)) / (2 * possibilities);
  return 1 - Math.exp(exponent);
}

const tool: ToolDefinition = {
  id: 'nanoid',
  name: 'NanoID Generator',
  description: 'Generate compact, URL-friendly unique identifiers',
  category: 'generators',
  keywords: ['nanoid', 'id', 'unique', 'identifier', 'short', 'url-safe'],
  icon: 'Hash',
  component: () => import('./NanoIdGenerator'),
};

export default tool;
