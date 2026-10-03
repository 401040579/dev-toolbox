import { useParams, Link } from 'react-router-dom';
import { getToolsByCategory } from '@/tools/registry';
import { CATEGORY_META } from '@/lib/constants';
import type { ToolCategory } from '@/tools/types';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '@/i18n/tool-copy';

export default function CategoryPage() {
  const { t } = useTranslation();
  const { category } = useParams<{ category: string }>();
  const cat = category as ToolCategory;
  const meta = CATEGORY_META[cat];
  const tools = getToolsByCategory(cat);

  if (!meta) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">{t('common.categoryNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{t(`categories.${cat}`)}</h1>
        <p className="text-sm text-text-secondary mt-1">{t(`categoryDesc.${cat}`)}</p>
      </div>

      {tools.length === 0 ? (
        <p className="text-text-muted text-sm">{t('common.noTools')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={`/tools/${cat}/${tool.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-hover transition-colors"
            >
              <div>
                <div className="font-medium text-text-primary text-sm">{getToolCopy(tool, t).name}</div>
                <div className="text-xs text-text-muted mt-0.5">{getToolCopy(tool, t).description}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
