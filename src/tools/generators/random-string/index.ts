import type { ToolDefinition } from '@/tools/types';

export type StringType = 'alphanumeric' | 'alpha' | 'numeric' | 'hex' | 'binary' | 'base64' | 'custom';

export interface RandomStringOptions {
  type: StringType;
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  customChars?: string;
}

const CHARSETS: Record<string, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  numeric: '0123456789',
  hex: '0123456789abcdef',
  binary: '01',
  base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
};

export function generateRandomString(options: Partial<RandomStringOptions> = {}): string {
  const {
    type = 'alphanumeric',
    length = 16,
    uppercase = true,
    lowercase = true,
    customChars,
  } = options;

  let charset: string;

  if (type === 'custom' && customChars) {
    charset = customChars;
  } else {
    charset = CHARSETS[type] ?? CHARSETS.alphanumeric!;
  }

  // Apply case filters for alpha types
  if (type === 'alpha' || type === 'alphanumeric') {
    if (!uppercase) {
      charset = charset.replace(/[A-Z]/g, '');
    }
    if (!lowercase) {
      charset = charset.replace(/[a-z]/g, '');
    }
  }

  if (charset.length === 0) {
    return '';
  }

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i]! % charset.length];
  }

  return result;
}

export function generateRandomStrings(
  count: number,
  options: Partial<RandomStringOptions> = {}
): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateRandomString(options));
  }
  return results;
}

// Generate a readable random string (alternating vowels and consonants)
export function generatePronounceable(length: number): string {
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const vowels = 'aeiou';

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    const chars = i % 2 === 0 ? consonants : vowels;
    result += chars[randomValues[i]! % chars.length];
  }

  return result;
}

const tool: ToolDefinition = {
  id: 'random-string',
  name: 'Random String Generator',
  description: 'Generate random strings with custom character sets',
  category: 'generators',
  keywords: ['random', 'string', 'text', 'characters', 'alphanumeric', 'hex'],
  icon: 'Type',
  component: () => import('./RandomString'),
};

export default tool;
