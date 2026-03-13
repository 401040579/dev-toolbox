import type { ToolDefinition } from '@/tools/types';

const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(num: number): string {
  if (num <= 0 || num > 3999 || !Number.isInteger(num)) return '';
  let result = '';
  let remaining = num;
  for (const [value, symbol] of ROMAN_MAP) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

export function fromRoman(roman: string): number {
  const s = roman.toUpperCase().trim();
  if (!s || !/^[IVXLCDM]+$/.test(s)) return 0;

  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;

  for (let i = 0; i < s.length; i++) {
    const current = values[s[i]!]!;
    const next = i + 1 < s.length ? values[s[i + 1]!]! : 0;
    if (current < next) {
      total -= current;
    } else {
      total += current;
    }
  }

  return total;
}

const tool: ToolDefinition = {
  id: 'roman-numeral',
  name: 'Roman Numeral Converter',
  description: 'Convert between Arabic and Roman numerals',
  category: 'math',
  keywords: ['roman', 'numeral', 'convert', 'number', 'arabic'],
  icon: 'Hash',
  component: () => import('./RomanNumeral'),
};

export default tool;
