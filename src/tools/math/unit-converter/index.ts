import type { ToolDefinition } from '@/tools/types';

export type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed' | 'time';

export interface UnitDef {
  name: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export const UNIT_CATEGORIES: Record<UnitCategory, { label: string; units: Record<string, UnitDef> }> = {
  length: {
    label: 'Length',
    units: {
      m: { name: 'Meter', toBase: (v) => v, fromBase: (v) => v },
      km: { name: 'Kilometer', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      cm: { name: 'Centimeter', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      mm: { name: 'Millimeter', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      mi: { name: 'Mile', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      yd: { name: 'Yard', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      ft: { name: 'Foot', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      in: { name: 'Inch', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    },
  },
  weight: {
    label: 'Weight',
    units: {
      kg: { name: 'Kilogram', toBase: (v) => v, fromBase: (v) => v },
      g: { name: 'Gram', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      mg: { name: 'Milligram', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      lb: { name: 'Pound', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      oz: { name: 'Ounce', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      t: { name: 'Metric Ton', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    },
  },
  temperature: {
    label: 'Temperature',
    units: {
      c: { name: 'Celsius', toBase: (v) => v, fromBase: (v) => v },
      f: { name: 'Fahrenheit', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      k: { name: 'Kelvin', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    },
  },
  area: {
    label: 'Area',
    units: {
      sqm: { name: 'Square Meter', toBase: (v) => v, fromBase: (v) => v },
      sqkm: { name: 'Square Kilometer', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      sqft: { name: 'Square Foot', toBase: (v) => v * 0.0929, fromBase: (v) => v / 0.0929 },
      acre: { name: 'Acre', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      ha: { name: 'Hectare', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    },
  },
  volume: {
    label: 'Volume',
    units: {
      l: { name: 'Liter', toBase: (v) => v, fromBase: (v) => v },
      ml: { name: 'Milliliter', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      gal: { name: 'US Gallon', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      qt: { name: 'US Quart', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
      cup: { name: 'US Cup', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      floz: { name: 'US Fluid Ounce', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    },
  },
  speed: {
    label: 'Speed',
    units: {
      ms: { name: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      kmh: { name: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      mph: { name: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      kn: { name: 'Knot', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    },
  },
  time: {
    label: 'Time',
    units: {
      s: { name: 'Second', toBase: (v) => v, fromBase: (v) => v },
      ms_time: { name: 'Millisecond', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      min: { name: 'Minute', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      hr: { name: 'Hour', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      day: { name: 'Day', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      wk: { name: 'Week', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    },
  },
};

export function convert(value: number, fromUnit: string, toUnit: string, category: UnitCategory): number {
  const units = UNIT_CATEGORIES[category].units;
  const from = units[fromUnit];
  const to = units[toUnit];
  if (!from || !to) return NaN;
  const base = from.toBase(value);
  return to.fromBase(base);
}

const tool: ToolDefinition = {
  id: 'unit-converter',
  name: 'Unit Converter',
  description: 'Convert between units of length, weight, temperature, and more',
  category: 'math',
  keywords: ['unit', 'convert', 'length', 'weight', 'temperature', 'area', 'volume'],
  icon: 'ArrowLeftRight',
  component: () => import('./UnitConverter'),
};

export default tool;
