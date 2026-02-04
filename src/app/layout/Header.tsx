import { Search, Languages } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle/ThemeToggle';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('dev-toolbox-lang', next);
  };

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
        <span className="hidden sm:inline">{t('common.search')}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border text-xs font-mono text-text-muted">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={toggleLanguage}
        className="ml-2 p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
        aria-label="Switch language"
        title={i18n.language === 'zh' ? 'English' : '中文'}
      >
        <Languages size={16} />
      </button>

      <ThemeToggle className="md:hidden ml-2" />
    </header>
  );
}
