import type { ToolDefinition } from '@/tools/types';

export interface CompressOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export function compressImage(
  file: File,
  options: Partial<CompressOptions> = {}
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress'));
            return;
          }
          const dataUrl = canvas.toDataURL(format, quality);
          resolve({ blob, dataUrl, width, height });
        },
        format,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const tool: ToolDefinition = {
  id: 'image-compressor',
  name: 'Image Compressor',
  description: 'Compress and resize images in the browser',
  category: 'image',
  keywords: ['image', 'compress', 'resize', 'optimize', 'quality', 'reduce'],
  icon: 'Minimize2',
  component: () => import('./ImageCompressor'),
};

export default tool;
