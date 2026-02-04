import { Link } from 'react-router-dom';
import {
  Clock,
  FileCode,
  Type,
  Braces,
  Sparkles,
  Shield,
  GitBranch,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/app';
import { getToolList, getTool } from '@/tools/registry';
import { CATEGORIES } from '@/lib/constants';
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

export default function HomePage() {
  const { recentTools, favorites } = useAppStore();
  const { t } = useTranslation();
  const allTools = getToolList();

  const favoriteTools = favorites
    .map((id) => getTool(id))
    .filter((t): t is NonNullable<typeof t> => t != null);

  const recentToolDefs = recentTools
    .map((id) => getTool(id))
    .filter((t): t is NonNullable<typeof t> => t != null)
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:p-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary font-mono">
          <span className="text-accent">&gt;</span> {t('app.title')}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('app.tagline')}
        </p>
      </div>

      {/* Quick access: Pipeline */}
      <Link
        to="/pipeline"
        className="flex items-center gap-3 p-4 rounded-lg border border-border bg-surface hover:border-accent-muted hover:bg-surface-hover transition-colors group"
      >
        <div className="p-2 rounded-md bg-accent-muted text-accent">
          <GitBranch size={20} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-text-primary text-sm">{t('pipeline.title')}</div>
          <div className="text-xs text-text-secondary">
            Chain transforms together — Base64 → JSON → Hash
          </div>
        </div>
        <ArrowRight
          size={16}
          className="text-text-muted group-hover:text-accent transition-colors"
        />
      </Link>

      {/* Favorites */}
      {favoriteTools.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
            <Star size={14} />
            {t('nav.favorites')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      {recentToolDefs.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">{t('nav.recent')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentToolDefs.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('nav.categories')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const toolCount = allTools.filter((tool) => tool.category === cat).length;
            return (
              <Link
                key={cat}
                to={`/tools/${cat}`}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-hover transition-colors"
              >
                <div className="p-2 rounded-md bg-surface-hover text-text-secondary">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-medium text-text-primary text-sm">{t(`categories.${cat}`)}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {toolCount} tool{toolCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All tools */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">{t('nav.allTools')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ToolCard({ tool }: { tool: { id: string; name: string; description: string; category: ToolCategory } }) {
  const { favorites, toggleFavorite } = useAppStore();
  const isFav = favorites.includes(tool.id);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border hover:border-border-strong hover:bg-surface-hover transition-colors">
      <Link to={`/tools/${tool.category}/${tool.id}`} className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{tool.name}</div>
        <div className="text-xs text-text-muted">{tool.description}</div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); toggleFavorite(tool.id); }}
        className="shrink-0 p-1 rounded text-text-muted hover:text-warning transition-colors"
        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={14} fill={isFav ? 'currentColor' : 'none'} className={isFav ? 'text-warning' : ''} />
      </button>
    </div>
  );
}
