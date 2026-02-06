import type { ToolDefinition } from '@/tools/types';

export type BlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

interface SimMatrix {
  r: [number, number, number];
  g: [number, number, number];
  b: [number, number, number];
}

// Color blindness simulation matrices
const MATRICES: Record<BlindnessType, SimMatrix> = {
  protanopia: {
    r: [0.567, 0.433, 0],
    g: [0.558, 0.442, 0],
    b: [0, 0.242, 0.758],
  },
  deuteranopia: {
    r: [0.625, 0.375, 0],
    g: [0.7, 0.3, 0],
    b: [0, 0.3, 0.7],
  },
  tritanopia: {
    r: [0.95, 0.05, 0],
    g: [0, 0.433, 0.567],
    b: [0, 0.475, 0.525],
  },
  achromatopsia: {
    r: [0.299, 0.587, 0.114],
    g: [0.299, 0.587, 0.114],
    b: [0.299, 0.587, 0.114],
  },
};

export function simulateColorBlindness(hex: string, type: BlindnessType): string {
  const match = hex.replace('#', '').match(/[a-f\d]{2}/gi);
  if (!match || match.length < 3) return hex;

  const r = parseInt(match[0]!, 16);
  const g = parseInt(match[1]!, 16);
  const b = parseInt(match[2]!, 16);

  const matrix = MATRICES[type];
  const nr = Math.round(matrix.r[0] * r + matrix.r[1] * g + matrix.r[2] * b);
  const ng = Math.round(matrix.g[0] * r + matrix.g[1] * g + matrix.g[2] * b);
  const nb = Math.round(matrix.b[0] * r + matrix.b[1] * g + matrix.b[2] * b);

  return '#' + [nr, ng, nb]
    .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
    .join('');
}

export const BLINDNESS_TYPES: { type: BlindnessType; label: string; prevalence: string }[] = [
  { type: 'protanopia', label: 'Protanopia', prevalence: '~1% of males' },
  { type: 'deuteranopia', label: 'Deuteranopia', prevalence: '~1% of males' },
  { type: 'tritanopia', label: 'Tritanopia', prevalence: '~0.003%' },
  { type: 'achromatopsia', label: 'Achromatopsia', prevalence: '~0.003%' },
];

const tool: ToolDefinition = {
  id: 'color-blindness',
  name: 'Color Blindness Simulator',
  description: 'Simulate how colors appear to people with color vision deficiencies',
  category: 'color',
  keywords: ['color', 'blindness', 'accessibility', 'a11y', 'vision', 'simulate'],
  icon: 'EyeOff',
  component: () => import('./ColorBlindness'),
};

export default tool;
