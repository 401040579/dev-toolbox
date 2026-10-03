import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useAppStore();
  const { t } = useTranslation();
  const label = theme === 'dark' ? t('common.switchToLightMode') : t('common.switchToDarkMode');

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors',
        className,
      )}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
