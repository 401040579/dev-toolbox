import type { ToolDefinition } from '@/tools/types';

export type NumberType = 'integer' | 'decimal' | 'gaussian';

export interface RandomNumberOptions {
  type: NumberType;
  min: number;
  max: number;
  decimalPlaces: number;
  unique: boolean;
}

// Generate a random integer between min and max (inclusive)
export function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return min + (randomBuffer[0]! % range);
}

// Generate a random decimal between min and max
export function randomDecimal(min: number, max: number, decimalPlaces: number): number {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const random = randomBuffer[0]! / 0xFFFFFFFF;
  const value = min + random * (max - min);
  return Number(value.toFixed(decimalPlaces));
}

// Generate a random number from a Gaussian (normal) distribution
// Using Box-Muller transform
export function randomGaussian(mean: number, stdDev: number): number {
  const randomBuffer = new Uint32Array(2);
  crypto.getRandomValues(randomBuffer);
  const u1 = randomBuffer[0]! / 0xFFFFFFFF;
  const u2 = randomBuffer[1]! / 0xFFFFFFFF;

  // Box-Muller transform
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

// Generate multiple random numbers
export function generateRandomNumbers(
  count: number,
  options: Partial<RandomNumberOptions> = {}
): number[] {
  const {
    type = 'integer',
    min = 0,
    max = 100,
    decimalPlaces = 2,
    unique = false,
  } = options;

  const results: number[] = [];
  const seen = new Set<number>();
  const maxAttempts = count * 10;
  let attempts = 0;

  while (results.length < count && attempts < maxAttempts) {
    let value: number;

    switch (type) {
      case 'integer':
        value = randomInt(min, max);
        break;
      case 'decimal':
        value = randomDecimal(min, max, decimalPlaces);
        break;
      case 'gaussian':
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6; // 99.7% within range
        value = randomGaussian(mean, stdDev);
        value = Math.max(min, Math.min(max, value));
        value = Number(value.toFixed(decimalPlaces));
        break;
      default:
        value = randomInt(min, max);
    }

    if (unique) {
      if (!seen.has(value)) {
        seen.add(value);
        results.push(value);
      }
    } else {
      results.push(value);
    }

    attempts++;
  }

  return results;
}

// Calculate statistics
export function calculateStats(numbers: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  sum: number;
} {
  if (numbers.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, sum: 0 };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;

  const median = numbers.length % 2 === 0
    ? (sorted[numbers.length / 2 - 1]! + sorted[numbers.length / 2]!) / 2
    : sorted[Math.floor(numbers.length / 2)]!;

  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    mean,
    median,
    stdDev,
    sum,
  };
}

const tool: ToolDefinition = {
  id: 'random-number',
  name: 'Random Number Generator',
  description: 'Generate cryptographically secure random numbers',
  category: 'generators',
  keywords: ['random', 'number', 'integer', 'decimal', 'gaussian', 'dice', 'lottery'],
  icon: 'Dice5',
  component: () => import('./RandomNumber'),
};

export default tool;
