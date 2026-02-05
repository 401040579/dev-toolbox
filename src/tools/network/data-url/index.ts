import type { ToolDefinition } from '@/tools/types';

export interface DataURLInfo {
  mimeType: string;
  encoding: string;
  data: string;
  size: number;
  decodedSize: number;
}

export function parseDataURL(url: string): DataURLInfo | null {
  const match = url.match(/^data:([^;,]+)?(?:;([^,]+))?,(.*)$/);
  if (!match) return null;

  const mimeType = match[1] || 'text/plain';
  const encoding = match[2] || '';
  const data = match[3] || '';

  let decodedSize = data.length;
  if (encoding === 'base64') {
    try {
      decodedSize = atob(data).length;
    } catch {
      return null;
    }
  }

  return {
    mimeType,
    encoding: encoding || 'url-encoded',
    data,
    size: url.length,
    decodedSize,
  };
}

export function createDataURL(content: string, mimeType: string, base64: boolean): string {
  if (base64) {
    const encoded = btoa(unescape(encodeURIComponent(content)));
    return `data:${mimeType};base64,${encoded}`;
  }
  return `data:${mimeType},${encodeURIComponent(content)}`;
}

export function dataURLToBlob(dataURL: string): Blob | null {
  const info = parseDataURL(dataURL);
  if (!info) return null;

  try {
    let byteString: string;
    if (info.encoding === 'base64') {
      byteString = atob(info.data);
    } else {
      byteString = decodeURIComponent(info.data);
    }

    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    return new Blob([bytes], { type: info.mimeType });
  } catch {
    return null;
  }
}

const tool: ToolDefinition = {
  id: 'data-url',
  name: 'Data URL Generator',
  description: 'Create and parse Data URLs (data: URIs)',
  category: 'network',
  keywords: ['data', 'url', 'uri', 'base64', 'encode', 'embed', 'inline'],
  icon: 'FileCode',
  component: () => import('./DataUrl'),
};

export default tool;
