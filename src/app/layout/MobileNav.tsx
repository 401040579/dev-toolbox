import { NavLink } from 'react-router-dom';
import { Home, GitBranch, Wrench, Clock, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/tools/encoding', icon: FileCode, label: 'Encode' },
  { to: '/tools/time', icon: Clock, label: 'Time' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/tools/generators', icon: Wrench, label: 'More' },
];

export function MobileNav() {
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
