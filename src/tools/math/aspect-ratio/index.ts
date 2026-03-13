import type { ToolDefinition } from '@/tools/types';

export interface AspectRatioResult {
  width: number;
  height: number;
  ratio: string;
  decimal: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function calculateRatio(width: number, height: number): AspectRatioResult {
  const d = gcd(width, height);
  return {
    width,
    height,
    ratio: d > 0 ? `${width / d}:${height / d}` : '0:0',
    decimal: height > 0 ? width / height : 0,
  };
}

export function calculateDimension(
  knownDim: 'width' | 'height',
  knownValue: number,
  ratioW: number,
  ratioH: number
): { width: number; height: number } {
  if (knownDim === 'width') {
    return { width: knownValue, height: Math.round((knownValue * ratioH) / ratioW) };
  }
  return { width: Math.round((knownValue * ratioW) / ratioH), height: knownValue };
}

export const COMMON_RATIOS: { label: string; w: number; h: number }[] = [
  { label: '1:1 (Square)', w: 1, h: 1 },
  { label: '4:3 (Standard)', w: 4, h: 3 },
  { label: '16:9 (Widescreen)', w: 16, h: 9 },
  { label: '16:10', w: 16, h: 10 },
  { label: '21:9 (Ultrawide)', w: 21, h: 9 },
  { label: '3:2 (Photo)', w: 3, h: 2 },
  { label: '9:16 (Mobile)', w: 9, h: 16 },
  { label: '2:3 (Portrait)', w: 2, h: 3 },
];

const tool: ToolDefinition = {
  id: 'aspect-ratio',
  name: 'Aspect Ratio Calculator',
  description: 'Calculate and convert aspect ratios',
  category: 'math',
  keywords: ['aspect', 'ratio', 'resolution', 'screen', 'dimension', 'width', 'height'],
  icon: 'Maximize',
  component: () => import('./AspectRatio'),
};

export default tool;
