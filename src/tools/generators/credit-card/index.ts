import type { ToolDefinition } from '@/tools/types';

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'random';

interface CardConfig {
  name: string;
  prefixes: string[];
  length: number;
}

const CARD_CONFIGS: Record<Exclude<CardType, 'random'>, CardConfig> = {
  visa: {
    name: 'Visa',
    prefixes: ['4'],
    length: 16,
  },
  mastercard: {
    name: 'Mastercard',
    prefixes: ['51', '52', '53', '54', '55', '2221', '2720'],
    length: 16,
  },
  amex: {
    name: 'American Express',
    prefixes: ['34', '37'],
    length: 15,
  },
  discover: {
    name: 'Discover',
    prefixes: ['6011', '644', '645', '646', '647', '648', '649', '65'],
    length: 16,
  },
};

// Generate Luhn check digit
function luhnCheckDigit(partial: string): number {
  let sum = 0;
  for (let i = 0; i < partial.length; i++) {
    let digit = parseInt(partial[partial.length - 1 - i]!, 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

// Validate using Luhn algorithm
export function validateLuhn(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Detect card type from number
export function detectCardType(number: string): string | null {
  const digits = number.replace(/\D/g, '');

  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^(6011|64[4-9]|65)/.test(digits)) return 'Discover';
  if (/^35/.test(digits)) return 'JCB';
  if (/^3(0[0-5]|[68])/.test(digits)) return 'Diners Club';

  return null;
}

// Generate a valid credit card number
export function generateCreditCard(type: CardType = 'visa'): string {
  const cardTypes = ['visa', 'mastercard', 'amex', 'discover'] as const;
  const cardType: Exclude<CardType, 'random'> = type === 'random'
    ? cardTypes[Math.floor(Math.random() * cardTypes.length)]!
    : type;

  const config = CARD_CONFIGS[cardType];
  const prefix = config.prefixes[Math.floor(Math.random() * config.prefixes.length)]!;
  const targetLength = config.length;

  // Generate random digits
  let number = prefix;
  const randomValues = new Uint8Array(targetLength - prefix.length - 1);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < randomValues.length; i++) {
    number += randomValues[i]! % 10;
  }

  // Add check digit
  number += luhnCheckDigit(number);

  return number;
}

// Format card number with spaces
export function formatCardNumber(number: string): string {
  const digits = number.replace(/\D/g, '');

  // American Express: 4-6-5
  if (/^3[47]/.test(digits) && digits.length === 15) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10)}`;
  }

  // Others: 4-4-4-4
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Generate multiple credit cards
export function generateCreditCards(count: number, type: CardType = 'visa'): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateCreditCard(type));
  }
  return results;
}

const tool: ToolDefinition = {
  id: 'credit-card',
  name: 'Credit Card Generator',
  description: 'Generate valid test credit card numbers (Luhn algorithm)',
  category: 'generators',
  keywords: ['credit', 'card', 'luhn', 'visa', 'mastercard', 'test', 'payment'],
  icon: 'CreditCard',
  component: () => import('./CreditCardGenerator'),
};

export default tool;
