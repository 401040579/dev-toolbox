import type { ToolDefinition } from '@/tools/types';

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
  let result = svg;

  // Remove XML declaration
  if (options.removeXMLDecl) {
    result = result.replace(/<\?xml[^?]*\?>\s*/gi, '');
  }

  // Remove comments
  if (options.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Remove metadata
  if (options.removeMetadata) {
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  }

  // Remove empty attributes
  if (options.removeEmptyAttrs) {
    result = result.replace(/\s+\w+=""/g, '');
  }

  // Minify: remove excess whitespace
  if (options.minify && !options.prettify) {
    result = result
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+\/>/g, '/>')
      .trim();
  }

  // Prettify: basic indentation
  if (options.prettify) {
    result = prettifySvg(result);
  }

  return result;
}

function prettifySvg(svg: string): string {
  // Normalize whitespace first
  let s = svg.replace(/>\s+</g, '>\n<').replace(/\s+/g, ' ').trim();

  const lines = s.split('\n');
  let indent = 0;
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Closing tag
    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }

    output.push('  '.repeat(indent) + trimmed);

    // Self-closing or closing tags don't increase indent
    if (trimmed.endsWith('/>') || trimmed.startsWith('</')) {
      // no change
    } else if (trimmed.startsWith('<') && !trimmed.startsWith('<!')) {
      indent++;
    }
  }

  return output.join('\n');
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
