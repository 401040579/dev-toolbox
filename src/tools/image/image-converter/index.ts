import type { ToolDefinition } from '@/tools/types';

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp';

export function convertImage(
  file: File,
  targetFormat: ImageFormat,
  quality = 0.92
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // For JPEG/BMP, fill white background (no alpha)
      if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Conversion failed'));
            return;
          }
          const dataUrl = canvas.toDataURL(targetFormat, quality);
          resolve({ blob, dataUrl });
        },
        targetFormat,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function getFormatExtension(format: ImageFormat): string {
  switch (format) {
    case 'image/png': return 'png';
    case 'image/jpeg': return 'jpg';
    case 'image/webp': return 'webp';
    case 'image/bmp': return 'bmp';
    default: return 'png';
  }
}

const tool: ToolDefinition = {
  id: 'image-converter',
  name: 'Image Format Converter',
  description: 'Convert images between PNG, JPEG, WebP, and BMP',
  category: 'image',
  keywords: ['image', 'convert', 'format', 'png', 'jpeg', 'webp', 'bmp'],
  icon: 'RefreshCw',
  component: () => import('./ImageConverter'),
};

export default tool;
