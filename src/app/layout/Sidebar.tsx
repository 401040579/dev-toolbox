import { NavLink } from 'react-router-dom';
import {
  Clock,
  FileCode,
  Type,
  Braces,
  Sparkles,
  Shield,
  Home,
  GitBranch,
  Info,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { ThemeToggle } from '@/components/theme-toggle/ThemeToggle';
import { useTranslation } from 'react-i18next';
import type { ToolCategory } from '@/tools/types';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<ToolCategory, LucideIcon> = {
  time: Clock,
  encoding: FileCode,
  text: Type,
  json: Braces,
  generators: Sparkles,
  crypto: Shield,
};

const categories: ToolCategory[] = ['time', 'encoding', 'text', 'json', 'generators', 'crypto'];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full bg-surface border-r border-border transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-border">
        {!sidebarCollapsed && (
          <span className="font-mono font-bold text-accent text-sm tracking-tight">
            DevToolbox
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors ml-auto"
          aria-label={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <SidebarLink to="/" icon={Home} label={t('nav.home')} collapsed={sidebarCollapsed} end />
        <SidebarLink to="/pipeline" icon={GitBranch} label={t('nav.pipeline')} collapsed={sidebarCollapsed} />

        <div className="pt-3 pb-1">
          {!sidebarCollapsed && (
            <span className="px-2 text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('nav.tools')}
            </span>
          )}
        </div>

        {categories.map((cat) => (
          <SidebarLink
            key={cat}
            to={`/tools/${cat}`}
            icon={CATEGORY_ICONS[cat]}
            label={t(`categories.${cat}`)}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 flex items-center justify-center gap-2">
        <SidebarLink to="/about" icon={Info} label={t('nav.about')} collapsed={sidebarCollapsed} />
        <ThemeToggle />
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-accent-muted text-accent font-medium'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
          collapsed && 'justify-center px-0',
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
