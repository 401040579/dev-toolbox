import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useAppStore();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors',
        className,
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
