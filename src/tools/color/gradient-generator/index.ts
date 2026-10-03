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
  // A color value must never expand into additional background layers.
  const safeColor = (value: string) => {
    const candidate = value.trim();
    const syntax = /^(?:#[\da-f]{3,8}|[a-z]+|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+/-]+\))$/i;
    return syntax.test(candidate) ? candidate : 'transparent';
  };
  const stopsStr = config.stops
    .map((s) => `${safeColor(s.color)} ${Number.isFinite(s.position) ? s.position : 0}%`)
    .join(', ');

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${Number.isFinite(config.angle) ? config.angle : 0}deg, ${stopsStr})`;
    case 'radial':
      return `radial-gradient(circle, ${stopsStr})`;
    case 'conic':
      return `conic-gradient(from ${Number.isFinite(config.angle) ? config.angle : 0}deg, ${stopsStr})`;
    default:
      return `linear-gradient(${Number.isFinite(config.angle) ? config.angle : 0}deg, ${stopsStr})`;
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
