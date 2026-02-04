import { NavLink } from 'react-router-dom';
import { Home, GitBranch, Wrench, Clock, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function MobileNav() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home'), end: true },
    { to: '/tools/encoding', icon: FileCode, label: t('categories.encoding') },
    { to: '/tools/time', icon: Clock, label: t('categories.time') },
    { to: '/pipeline', icon: GitBranch, label: t('nav.pipeline') },
    { to: '/tools/generators', icon: Wrench, label: t('categories.generators') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                isActive ? 'text-accent' : 'text-text-secondary',
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
