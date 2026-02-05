import type { ToolDefinition } from '@/tools/types';
import { md5Bytes } from '../md5';
import { crc32 } from '../checksum';

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'CRC32';

export async function hashFile(
  file: File,
  algorithm: HashAlgorithm,
  onProgress?: (progress: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  onProgress?.(50);

  if (algorithm === 'MD5') {
    const result = md5Bytes(bytes);
    onProgress?.(100);
    return result;
  }

  if (algorithm === 'CRC32') {
    const result = crc32(bytes);
    onProgress?.(100);
    return result;
  }

  // Use Web Crypto API for SHA algorithms
  const hashBuffer = await crypto.subtle.digest(algorithm, bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  onProgress?.(100);
  return hashHex;
}

export async function hashFileMultiple(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Record<HashAlgorithm, string>> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'CRC32'];
  const results: Partial<Record<HashAlgorithm, string>> = {};

  for (let i = 0; i < algorithms.length; i++) {
    const algo = algorithms[i]!;

    if (algo === 'MD5') {
      results[algo] = md5Bytes(bytes);
    } else if (algo === 'CRC32') {
      results[algo] = crc32(bytes);
    } else {
      const hashBuffer = await crypto.subtle.digest(algo, bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      results[algo] = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    onProgress?.(Math.round(((i + 1) / algorithms.length) * 100));
  }

  return results as Record<HashAlgorithm, string>;
}

const tool: ToolDefinition = {
  id: 'hash-file',
  name: 'File Hash Calculator',
  description: 'Calculate MD5, SHA-1, SHA-256, SHA-512, CRC32 hashes for files',
  category: 'crypto',
  keywords: ['hash', 'file', 'md5', 'sha', 'sha256', 'sha512', 'checksum', 'crc32', 'verify'],
  icon: 'FileDigit',
  component: () => import('./HashFile'),
};

export default tool;
