import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getToolList } from '@/tools/registry';
import type { ToolCategory } from '@/tools/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tools = getToolList();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    },
    [open, onOpenChange],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectTool = (toolId: string, category: ToolCategory) => {
    navigate(`/tools/${category}/${toolId}`);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute top-[10%] sm:top-[20%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-full max-w-lg">
        <Command
          className="rounded-xl border border-border bg-surface shadow-lg overflow-hidden"
          label={t('common.search')}
        >
          <Command.Input
            placeholder={t('common.searchPlaceholder')}
            className="w-full px-4 py-3 text-sm bg-transparent text-text-primary placeholder:text-text-muted border-b border-border outline-none font-mono"
            autoFocus
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">
              {t('common.toolNotFound')}
            </Command.Empty>

            <Command.Group
              heading={t('common.navigation')}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted"
            >
              <Command.Item
                onSelect={() => {
                  navigate('/');
                  onOpenChange(false);
                }}
                className="flex items-center justify-between px-2 py-2 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-primary"
              >
                <span>{t('nav.home')}</span>
                <kbd className="hidden sm:inline text-xs font-mono text-text-muted">⇧⌘H</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  navigate('/pipeline');
                  onOpenChange(false);
                }}
                className="flex items-center justify-between px-2 py-2 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-primary"
              >
                <span>{t('pipeline.title')}</span>
                <kbd className="hidden sm:inline text-xs font-mono text-text-muted">⇧⌘P</kbd>
              </Command.Item>
            </Command.Group>

            {tools.length > 0 && (
              <Command.Group
                heading={t('common.toolsSection')}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted"
              >
                {tools.map((tool) => (
                  <Command.Item
                    key={tool.id}
                    value={`${tool.name} ${tool.keywords.join(' ')}`}
                    onSelect={() => selectTool(tool.id, tool.category)}
                    className="flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-primary"
                  >
                    <span>{tool.name}</span>
                    <span className="text-xs text-text-muted">
                      {t(`categories.${tool.category}`)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
