import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface ToolLayoutProps {
  title: string;
  description?: string;
  input: ReactNode;
  output: ReactNode;
  actions?: ReactNode;
}

export function ToolLayout({ title, description, input, output, actions }: ToolLayoutProps) {
  const [vertical, setVertical] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          {description && (
            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={() => setVertical((v) => !v)}
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={vertical ? 'Switch to horizontal layout' : 'Switch to vertical layout'}
          >
            {vertical ? <ArrowLeftRight size={16} /> : <ArrowUpDown size={16} />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          'flex-1 min-h-0',
          vertical ? 'flex flex-col' : 'flex flex-row',
        )}
      >
        <div className={cn('flex flex-col', vertical ? 'flex-1 min-h-0' : 'flex-1 min-w-0')}>
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            Input
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-auto">{input}</div>
        </div>
        <div className={cn(vertical ? 'border-t' : 'border-l', 'border-border')} />
        <div className={cn('flex flex-col', vertical ? 'flex-1 min-h-0' : 'flex-1 min-w-0')}>
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            Output
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-auto">{output}</div>
        </div>
      </div>
    </div>
  );
}
