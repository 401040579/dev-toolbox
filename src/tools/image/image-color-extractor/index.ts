import type { ToolDefinition } from '@/tools/types';

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
  percentage: number;
}

export function extractColors(file: File, maxColors: number = 8): Promise<ExtractedColor[]> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Scale down for performance
      const scale = Math.min(1, 100 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Count colors (quantize to reduce similar colors)
      const colorMap = new Map<string, number>();
      const totalPixels = pixels.length / 4;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i]! / 16) * 16;
        const g = Math.round(pixels[i + 1]! / 16) * 16;
        const b = Math.round(pixels[i + 2]! / 16) * 16;
        const a = pixels[i + 3]!;

        // Skip transparent pixels
        if (a < 128) continue;

        const key = `${Math.min(r, 255)},${Math.min(g, 255)},${Math.min(b, 255)}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }

      // Sort by frequency and take top N
      const sorted = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxColors);

      const colors: ExtractedColor[] = sorted.map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number) as [number, number, number];
        return {
          hex: '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join(''),
          rgb: { r, g, b },
          count,
          percentage: Math.round((count / totalPixels) * 1000) / 10,
        };
      });

      resolve(colors);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const tool: ToolDefinition = {
  id: 'image-color-extractor',
  name: 'Image Color Extractor',
  description: 'Extract dominant colors from images',
  category: 'image',
  keywords: ['image', 'color', 'extract', 'palette', 'dominant', 'eyedropper'],
  icon: 'Palette',
  component: () => import('./ImageColorExtractor'),
};

export default tool;
