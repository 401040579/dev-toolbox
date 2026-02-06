import type { ToolDefinition } from '@/tools/types';

export type GradientType = 'linear' | 'radial' | 'conic';
export type GradientDirection = 'to right' | 'to left' | 'to top' | 'to bottom' | 'to top right' | 'to bottom right' | 'to bottom left' | 'to top left';

export interface GradientStop {
  color: string;
  position: number;
}

export interface GradientConfig {
  type: GradientType;
  direction: GradientDirection;
  angle: number;
  stops: GradientStop[];
}

export function generateCSS(config: GradientConfig): string {
  const stopsStr = config.stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ');

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
    case 'radial':
      return `radial-gradient(circle, ${stopsStr})`;
    case 'conic':
      return `conic-gradient(from ${config.angle}deg, ${stopsStr})`;
    default:
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
  }
}

export const DEFAULT_CONFIG: GradientConfig = {
  type: 'linear',
  direction: 'to right',
  angle: 90,
  stops: [
    { color: '#3B82F6', position: 0 },
    { color: '#8B5CF6', position: 100 },
  ],
};

const tool: ToolDefinition = {
  id: 'gradient-generator',
  name: 'Gradient Generator',
  description: 'Create CSS gradients with live preview',
  category: 'color',
  keywords: ['gradient', 'css', 'linear', 'radial', 'conic', 'color'],
  icon: 'Brush',
  component: () => import('./GradientGenerator'),
};

export default tool;
