import type { ToolDefinition } from '@/tools/types';

export interface ShadeStep {
  hex: string;
  label: string;
  hsl: { h: number; s: number; l: number };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = hex.replace('#', '').match(/[a-f\d]{2}/gi);
  if (!result || result.length < 3) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[0]!, 16) / 255;
  let g = parseInt(result[1]!, 16) / 255;
  let b = parseInt(result[2]!, 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateShades(baseHex: string, steps: number = 11): ShadeStep[] {
  const base = hexToHsl(baseHex);
  const shades: ShadeStep[] = [];

  // Generate from lightest (high L) to darkest (low L)
  for (let i = 0; i < steps; i++) {
    const l = Math.round(100 - (i * 100) / (steps - 1));
    const hex = hslToHex(base.h, base.s, l);
    const label = `${Math.round((i / (steps - 1)) * 900) + 50}`;
    shades.push({ hex, label, hsl: { h: base.h, s: base.s, l } });
  }

  return shades;
}

export function generateTints(baseHex: string, steps: number = 11): ShadeStep[] {
  const base = hexToHsl(baseHex);
  const tints: ShadeStep[] = [];

  for (let i = 0; i < steps; i++) {
    // Vary saturation while keeping hue
    const s = Math.round(100 - (i * 100) / (steps - 1));
    const hex = hslToHex(base.h, s, base.l);
    tints.push({ hex, label: `S${s}`, hsl: { h: base.h, s, l: base.l } });
  }

  return tints;
}

const tool: ToolDefinition = {
  id: 'color-shades',
  name: 'Color Shades Generator',
  description: 'Generate shades and tints from a base color',
  category: 'color',
  keywords: ['color', 'shades', 'tints', 'lighter', 'darker', 'palette'],
  icon: 'Layers',
  component: () => import('./ColorShades'),
};

export default tool;
