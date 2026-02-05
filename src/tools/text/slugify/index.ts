import type { ToolDefinition } from '@/tools/types';

export interface SlugifyOptions {
  separator: string;
  lowercase: boolean;
  strict: boolean; // Remove special characters
  trim: boolean;
}

const DEFAULT_OPTIONS: SlugifyOptions = {
  separator: '-',
  lowercase: true,
  strict: true,
  trim: true,
};

// Character replacement map for common accented characters
const CHAR_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y', 'ß': 'ss',
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
  'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
  'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
  'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ý': 'Y',
};

export function slugify(input: string, options: Partial<SlugifyOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let result = input;

  // Replace accented characters
  result = result.replace(/[^\x00-\x7F]/g, (char) => CHAR_MAP[char] || char);

  // Convert to lowercase if needed
  if (opts.lowercase) {
    result = result.toLowerCase();
  }

  // Replace spaces and non-word characters with separator
  if (opts.strict) {
    result = result.replace(/[^\w\s-]/g, '');
  }

  // Replace whitespace with separator
  result = result.replace(/[\s_]+/g, opts.separator);

  // Remove duplicate separators
  result = result.replace(new RegExp(`${opts.separator}+`, 'g'), opts.separator);

  // Trim separators from start and end
  if (opts.trim) {
    result = result.replace(new RegExp(`^${opts.separator}+|${opts.separator}+$`, 'g'), '');
  }

  return result;
}

const tool: ToolDefinition = {
  id: 'slugify',
  name: 'Slugify',
  description: 'Convert text to URL-friendly slugs',
  category: 'text',
  keywords: ['slug', 'url', 'permalink', 'seo', 'friendly', 'convert'],
  icon: 'Link2',
  component: () => import('./Slugify'),
  transforms: [
    {
      id: 'slugify',
      name: 'Slugify',
      description: 'Convert text to URL slug',
      inputType: 'string',
      outputType: 'string',
      transform: (s) => slugify(s),
    },
  ],
};

export default tool;
