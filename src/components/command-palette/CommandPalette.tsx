import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { getToolList } from '@/tools/registry';
import { CATEGORY_META } from '@/lib/constants';
import type { ToolCategory } from '@/tools/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
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
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-xl border border-border bg-surface shadow-lg overflow-hidden"
          label="Search tools"
        >
          <Command.Input
            placeholder="Search tools..."
            className="w-full px-4 py-3 text-sm bg-transparent text-text-primary placeholder:text-text-muted border-b border-border outline-none font-mono"
            autoFocus
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">
              No tools found.
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted"
            >
              <Command.Item
                onSelect={() => {
                  navigate('/');
                  onOpenChange(false);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-primary"
              >
                Home
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  navigate('/pipeline');
                  onOpenChange(false);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-primary"
              >
                Pipeline Builder
              </Command.Item>
            </Command.Group>

            {tools.length > 0 && (
              <Command.Group
                heading="Tools"
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
                      {CATEGORY_META[tool.category].label}
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
