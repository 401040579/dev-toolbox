import type { ToolDefinition } from '@/tools/types';

export interface TruncateOptions {
  length: number;
  ending: string;
  preserveWords: boolean;
}

function splitsSurrogatePair(input: string, index: number): boolean {
  const before = input.charCodeAt(index - 1);
  const after = input.charCodeAt(index);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}

// Keep the existing UTF-16 budget, but do not cut a valid surrogate pair in half.
function sliceWithoutSplittingSurrogates(input: string, start: number, end = input.length): string {
  return input.slice(
    start + (splitsSurrogatePair(input, start) ? 1 : 0),
    end - (splitsSurrogatePair(input, end) ? 1 : 0)
  );
}

export function truncateText(
  input: string,
  options: Partial<TruncateOptions> = {}
): string {
  const { length = 100, ending = '...', preserveWords = true } = options;

  if (length <= 0) return '';

  if (input.length <= length) {
    return input;
  }

  const targetLength = length - ending.length;
  if (targetLength <= 0) {
    return sliceWithoutSplittingSurrogates(ending, 0, length);
  }

  let truncated = sliceWithoutSplittingSurrogates(input, 0, targetLength);

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
  if (maxLength <= 0) return '';

  if (input.length <= maxLength) {
    return input;
  }

  const sepLen = separator.length;
  const charsToShow = maxLength - sepLen;
  if (charsToShow <= 0) {
    return sliceWithoutSplittingSurrogates(separator, 0, maxLength);
  }

  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  const front = sliceWithoutSplittingSurrogates(input, 0, frontChars);
  const back = backChars > 0 ? sliceWithoutSplittingSurrogates(input, input.length - backChars) : '';
  return front + separator + back;
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
