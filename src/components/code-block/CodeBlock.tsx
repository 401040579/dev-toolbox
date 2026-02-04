import { CopyButton } from '@/components/copy-button/CopyButton';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  content: string;
  className?: string;
  maxHeight?: string;
}

export function CodeBlock({ content, className, maxHeight = '400px' }: CodeBlockProps) {
  return (
    <div className={cn('relative group rounded-lg border border-border bg-surface', className)}>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={content} />
      </div>
      <pre
        className="p-4 overflow-auto font-mono text-sm text-text-primary"
        style={{ maxHeight }}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}
