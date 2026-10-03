import type { ToolDefinition } from '@/tools/types';

import { Marked } from 'marked';
import { sanitizeMarkdownHtml } from '@/lib/preview-safety';

const markdown = new Marked({ gfm: true, breaks: false });
markdown.use({ renderer: {
  // Display raw HTML as text; don't interpret it as document markup.
  html({ text }) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
  // No automatic resource loading, including relative and data image URLs.
  image({ text }) { return `[Image: ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}]`; },
} });

export function parseMarkdown(input: string): string {
  return sanitizeMarkdownHtml(markdown.parse(input, { async: false }));
}

const tool: ToolDefinition = {
  id: 'markdown-preview',
  name: 'Markdown Preview',
  description: 'Preview and edit Markdown in real-time',
  category: 'text',
  keywords: ['markdown', 'preview', 'md', 'editor', 'render', 'html'],
  icon: 'FileText',
  component: () => import('./MarkdownPreview'),
};

export default tool;
