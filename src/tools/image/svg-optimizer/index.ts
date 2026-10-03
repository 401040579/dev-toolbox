import type { ToolDefinition } from '@/tools/types';
import { sanitizeSvg } from '@/lib/preview-safety';

export interface SvgOptimizeOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeEmptyAttrs: boolean;
  removeXMLDecl: boolean;
  minify: boolean;
  prettify: boolean;
}

export const DEFAULT_OPTIONS: SvgOptimizeOptions = {
  removeComments: true,
  removeMetadata: true,
  removeEmptyAttrs: true,
  removeXMLDecl: true,
  minify: true,
  prettify: false,
};

export function optimizeSvg(svg: string, options: SvgOptimizeOptions = DEFAULT_OPTIONS): string {
  const doc = sanitizeSvg(svg);
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (options.removeComments && child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      } else if (child instanceof Element && options.removeMetadata && child.localName === 'metadata') {
        child.remove();
      } else {
        walk(child);
      }
    }
    if (node instanceof Element) {
      if (options.removeEmptyAttrs) {
        for (const attr of Array.from(node.attributes)) {
          if (!attr.value && attr.name !== 'xmlns') node.removeAttributeNode(attr);
        }
      }
      // Preserve text content, attribute spacing, and explicit xml:space.
      if ((options.minify || options.prettify) && !node.closest('text, tspan, textPath, [xml\\:space="preserve"]')) {
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) child.remove();
        }
      }
    }
  };
  walk(doc.documentElement);
  const serializer = new XMLSerializer();
  const format = (node: Node, depth: number): string => {
    if (!(node instanceof Element) || !node.children.length ||
        Array.from(node.childNodes).some((child) => child.nodeType === Node.TEXT_NODE && child.textContent)) {
      return '  '.repeat(depth) + serializer.serializeToString(node);
    }
    const shell = node.cloneNode(false) as Element;
    const opening = serializer.serializeToString(shell).replace(/\s*\/>$/, '>');
    return '  '.repeat(depth) + opening + '\n' +
      Array.from(node.childNodes).map((child) => format(child, depth + 1)).join('\n') +
      '\n' + '  '.repeat(depth) + `</${node.nodeName}>`;
  };
  const result = options.prettify ? format(doc.documentElement, 0) : serializer.serializeToString(doc.documentElement);
  return !options.removeXMLDecl && svg.trimStart().startsWith('<?xml')
    ? '<?xml version="1.0" encoding="UTF-8"?>\n' + result : result;
}

export function getSvgStats(svg: string): { elements: number; size: number; viewBox: string } {
  const elements = (svg.match(/<[a-z]/gi) || []).length;
  const size = new Blob([svg]).size;
  const vbMatch = svg.match(/viewBox="([^"]*)"/);
  const viewBox = vbMatch ? vbMatch[1]! : 'N/A';
  return { elements, size, viewBox };
}

const tool: ToolDefinition = {
  id: 'svg-optimizer',
  name: 'SVG Optimizer',
  description: 'Optimize and minify SVG files',
  category: 'image',
  keywords: ['svg', 'optimize', 'minify', 'vector', 'clean'],
  icon: 'FileCode',
  component: () => import('./SvgOptimizer'),
};

export default tool;
