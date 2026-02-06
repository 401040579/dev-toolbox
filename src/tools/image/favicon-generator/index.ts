import type { ToolDefinition } from '@/tools/types';

export interface FaviconSize {
  width: number;
  height: number;
  label: string;
}

export const FAVICON_SIZES: FaviconSize[] = [
  { width: 16, height: 16, label: '16×16 (favicon)' },
  { width: 32, height: 32, label: '32×32 (favicon)' },
  { width: 48, height: 48, label: '48×48' },
  { width: 64, height: 64, label: '64×64' },
  { width: 128, height: 128, label: '128×128' },
  { width: 180, height: 180, label: '180×180 (Apple Touch)' },
  { width: 192, height: 192, label: '192×192 (Android)' },
  { width: 512, height: 512, label: '512×512 (PWA)' },
];

export function generateFavicon(
  file: File,
  size: FaviconSize,
  format: 'image/png' | 'image/x-icon' = 'image/png'
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Draw image scaled to target size
      ctx.drawImage(img, 0, 0, size.width, size.height);

      const mimeType = format === 'image/x-icon' ? 'image/png' : format;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate favicon'));
            return;
          }
          const dataUrl = canvas.toDataURL(mimeType);
          resolve({ blob, dataUrl });
        },
        mimeType
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const tool: ToolDefinition = {
  id: 'favicon-generator',
  name: 'Favicon Generator',
  description: 'Generate favicons and app icons from images',
  category: 'image',
  keywords: ['favicon', 'icon', 'apple', 'touch', 'pwa', 'generate', 'resize'],
  icon: 'Image',
  component: () => import('./FaviconGenerator'),
};

export default tool;
