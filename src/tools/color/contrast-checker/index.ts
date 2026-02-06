import type { ToolDefinition } from '@/tools/types';

export interface ContrastResult {
  ratio: number;
  aa: { normal: boolean; large: boolean };
  aaa: { normal: boolean; large: boolean };
}

function hexToLuminance(hex: string): number {
  const result = hex.replace('#', '').match(/[a-f\d]{2}/gi);
  if (!result || result.length < 3) return 0;
  const [r, g, b] = result.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrast(fg: string, bg: string): ContrastResult {
  const l1 = hexToLuminance(fg);
  const l2 = hexToLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    },
    aaa: {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    },
  };
}

export function getRatingLabel(pass: boolean): string {
  return pass ? 'Pass' : 'Fail';
}

const tool: ToolDefinition = {
  id: 'contrast-checker',
  name: 'Contrast Checker',
  description: 'Check color contrast ratios for WCAG accessibility compliance',
  category: 'color',
  keywords: ['contrast', 'wcag', 'accessibility', 'a11y', 'color', 'ratio'],
  icon: 'Eye',
  component: () => import('./ContrastChecker'),
};

export default tool;
