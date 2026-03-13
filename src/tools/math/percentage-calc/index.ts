import type { ToolDefinition } from '@/tools/types';

export type CalcMode = 'whatPercent' | 'percentOf' | 'percentChange' | 'addPercent' | 'subtractPercent';

export interface CalcResult {
  mode: CalcMode;
  result: number;
  formula: string;
}

export function calculate(mode: CalcMode, a: number, b: number): CalcResult {
  switch (mode) {
    case 'whatPercent':
      return { mode, result: (a / b) * 100, formula: `${a} ÷ ${b} × 100 = ${((a / b) * 100).toFixed(4)}%` };
    case 'percentOf':
      return { mode, result: (a / 100) * b, formula: `${a}% × ${b} = ${((a / 100) * b).toFixed(4)}` };
    case 'percentChange':
      return { mode, result: ((b - a) / a) * 100, formula: `(${b} - ${a}) ÷ ${a} × 100 = ${(((b - a) / a) * 100).toFixed(4)}%` };
    case 'addPercent':
      return { mode, result: a * (1 + b / 100), formula: `${a} × (1 + ${b}%) = ${(a * (1 + b / 100)).toFixed(4)}` };
    case 'subtractPercent':
      return { mode, result: a * (1 - b / 100), formula: `${a} × (1 - ${b}%) = ${(a * (1 - b / 100)).toFixed(4)}` };
  }
}

const tool: ToolDefinition = {
  id: 'percentage-calc',
  name: 'Percentage Calculator',
  description: 'Calculate percentages, changes, and proportions',
  category: 'math',
  keywords: ['percentage', 'percent', 'calculate', 'change', 'proportion'],
  icon: 'Percent',
  component: () => import('./PercentageCalc'),
};

export default tool;
