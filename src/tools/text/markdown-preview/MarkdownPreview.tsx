import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseMarkdown } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const SAMPLE_MARKDOWN = `# Heading 1
## Heading 2
### Heading 3

This is a paragraph with **bold**, *italic*, and ***bold italic*** text.

> This is a blockquote

- Unordered list item 1
- Unordered list item 2
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2

\`inline code\`

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

[Link to example](https://example.com)

---

That's all!
`;

export default function MarkdownPreview() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_MARKDOWN);

  const html = useMemo(() => parseMarkdown(input), [input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.markdownPreview.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.markdownPreview.description')}</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Editor */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-alt">
            <span className="text-xs font-medium text-text-muted uppercase">{t('tools.markdownPreview.editor')}</span>
            <CopyButton text={input} />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-4 font-mono text-sm resize-none border-0 focus:ring-0"
            placeholder={t('tools.markdownPreview.placeholder')}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-alt">
            <span className="text-xs font-medium text-text-muted uppercase">{t('tools.markdownPreview.preview')}</span>
            <CopyButton text={html} />
          </div>
          <div
            className="flex-1 p-4 overflow-auto prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              // Custom prose styles
              ['--tw-prose-headings' as string]: 'var(--text-primary)',
              ['--tw-prose-body' as string]: 'var(--text-primary)',
              ['--tw-prose-bold' as string]: 'var(--text-primary)',
              ['--tw-prose-links' as string]: 'var(--accent)',
              ['--tw-prose-code' as string]: 'var(--text-primary)',
              ['--tw-prose-pre-code' as string]: 'var(--text-primary)',
              ['--tw-prose-pre-bg' as string]: 'var(--surface-alt)',
              ['--tw-prose-quotes' as string]: 'var(--text-secondary)',
              ['--tw-prose-hr' as string]: 'var(--border)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
