import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle/ThemeToggle';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  return (
    <header className="flex items-center h-14 px-4 border-b border-border bg-surface">
      <span className="md:hidden font-mono font-bold text-accent text-sm tracking-tight">
        DevToolbox
      </span>

      <button
        onClick={onOpenCommandPalette}
        className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-text-secondary text-sm hover:border-border-strong hover:text-text-primary transition-colors"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search tools...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border text-xs font-mono text-text-muted">
          ⌘K
        </kbd>
      </button>

      <ThemeToggle className="md:hidden ml-2" />
    </header>
  );
}
