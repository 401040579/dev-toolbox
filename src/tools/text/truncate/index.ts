import type { ToolDefinition } from '@/tools/types';

export interface TruncateOptions {
  length: number;
  ending: string;
  preserveWords: boolean;
}

export function truncateText(
  input: string,
  options: Partial<TruncateOptions> = {}
): string {
  const { length = 100, ending = '...', preserveWords = true } = options;

  if (input.length <= length) {
    return input;
  }

  const targetLength = length - ending.length;
  if (targetLength <= 0) {
    return ending;
  }

  let truncated = input.slice(0, targetLength);

  if (preserveWords) {
    // Find the last space within the truncated text
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    }
  }

  // Remove trailing punctuation and whitespace
  truncated = truncated.replace(/[\s,.;:!?]+$/, '');

  return truncated + ending;
}

export function truncateMiddle(
  input: string,
  maxLength: number,
  separator = '...'
): string {
  if (input.length <= maxLength) {
    return input;
  }

  const sepLen = separator.length;
  const charsToShow = maxLength - sepLen;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return input.slice(0, frontChars) + separator + input.slice(-backChars);
}

const tool: ToolDefinition = {
  id: 'truncate',
  name: 'Truncate Text',
  description: 'Truncate text to a specific length with various options',
  category: 'text',
  keywords: ['truncate', 'shorten', 'cut', 'limit', 'text', 'ellipsis'],
  icon: 'Scissors',
  component: () => import('./Truncate'),
  transforms: [
    {
      id: 'truncate-100',
      name: 'Truncate to 100',
      description: 'Truncate text to 100 characters',
      inputType: 'string',
      outputType: 'string',
      transform: (s) => truncateText(s, { length: 100 }),
    },
  ],
};

export default tool;
