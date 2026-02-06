import type { ToolCategory } from '@/tools/types';

export const CATEGORY_META: Record<ToolCategory, { label: string; description: string; icon: string }> = {
  time: {
    label: 'Time',
    description: 'Date, time, and scheduling utilities',
    icon: 'Clock',
  },
  encoding: {
    label: 'Encoding',
    description: 'Encode, decode, and convert data formats',
    icon: 'FileCode',
  },
  text: {
    label: 'Text',
    description: 'Text manipulation and analysis',
    icon: 'Type',
  },
  json: {
    label: 'JSON / Data',
    description: 'Format, validate, and convert structured data',
    icon: 'Braces',
  },
  generators: {
    label: 'Generators',
    description: 'Generate UUIDs, passwords, hashes, and more',
    icon: 'Sparkles',
  },
  crypto: {
    label: 'Crypto',
    description: 'Hashing and cryptographic utilities',
    icon: 'Shield',
  },
  network: {
    label: 'Network',
    description: 'URL, IP, and network utilities',
    icon: 'Network',
  },
  image: {
    label: 'Image',
    description: 'Image conversion, compression, and manipulation',
    icon: 'Image',
  },
  color: {
    label: 'Color',
    description: 'Color conversion, palettes, and accessibility',
    icon: 'Palette',
  },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as ToolCategory[];
