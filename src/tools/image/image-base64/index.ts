import type { ToolDefinition } from '@/tools/types';

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(base64: string): Blob | null {
  try {
    // Handle data URL format
    const parts = base64.split(',');
    const mimeMatch = (parts[0] || '').match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1]! : 'image/png';
    const data = atob(parts[1] || parts[0] || '');
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      bytes[i] = data.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export function getImageInfo(dataUrl: string): { mime: string; size: number; base64Length: number } | null {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = (parts[0] || '').match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1]! : 'unknown';
    const base64Data = parts[1] || '';
    const size = Math.ceil(base64Data.length * 3 / 4);
    return { mime, size, base64Length: base64Data.length };
  } catch {
    return null;
  }
}

const tool: ToolDefinition = {
  id: 'image-base64',
  name: 'Image ↔ Base64',
  description: 'Convert images to Base64 and Base64 to images',
  category: 'image',
  keywords: ['image', 'base64', 'encode', 'decode', 'convert', 'data-url'],
  icon: 'ImagePlus',
  component: () => import('./ImageBase64'),
};

export default tool;
