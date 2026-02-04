import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, ArrowUpDown, Star } from 'lucide-react';
import { useAppStore } from '@/store/app';

interface ToolLayoutProps {
  title: string;
  description?: string;
  toolId?: string;
  input: ReactNode;
  output: ReactNode;
  actions?: ReactNode;
}

export function ToolLayout({ title, description, toolId, input, output, actions }: ToolLayoutProps) {
  const { t } = useTranslation();
  const [vertical, setVertical] = useState(false);
  const { favorites, toggleFavorite } = useAppStore();
  const isFav = toolId ? favorites.includes(toolId) : false;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-text-primary truncate">{title}</h1>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5 hidden sm:block">{description}</p>
            )}
          </div>
          {toolId && (
            <button
              onClick={() => toggleFavorite(toolId)}
              className="p-1.5 rounded-md text-text-muted hover:text-warning transition-colors shrink-0"
              aria-label={isFav ? t('toolLayout.removeFromFavorites') : t('toolLayout.addToFavorites')}
            >
              <Star size={16} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'text-warning' : ''} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {actions}
          <button
            onClick={() => setVertical((v) => !v)}
            className="hidden sm:flex p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={vertical ? t('toolLayout.switchToHorizontal') : t('toolLayout.switchToVertical')}
          >
            {vertical ? <ArrowLeftRight size={16} /> : <ArrowUpDown size={16} />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          'flex-1 min-h-0',
          // Always stack vertically on mobile, respect toggle on desktop
          vertical ? 'flex flex-col' : 'flex flex-col md:flex-row',
        )}
      >
        <div className={cn('flex flex-col', vertical ? 'flex-1 min-h-0' : 'flex-1 min-h-0 md:min-w-0')}>
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            {t('common.input')}
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-auto">{input}</div>
        </div>
        <div className={cn(vertical ? 'border-t' : 'border-t md:border-t-0 md:border-l', 'border-border')} />
        <div className={cn('flex flex-col', vertical ? 'flex-1 min-h-0' : 'flex-1 min-h-0 md:min-w-0')}>
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            {t('common.output')}
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-auto">{output}</div>
        </div>
      </div>
    </div>
  );
}
