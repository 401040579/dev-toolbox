import { useLocation, useParams } from 'react-router-dom';
import { Suspense, lazy, useMemo, useEffect } from 'react';
import { getTool } from '@/tools/registry';
import { useAppStore } from '@/store/app';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '@/i18n/tool-copy';
import { ToolDraftBoundary } from '@/components/tool-drafts/ToolDraftBoundary';

export default function ToolPage() {
  const { t } = useTranslation();
  const { toolId } = useParams<{ toolId: string }>();
  const location = useLocation();
  const tool = toolId ? getTool(toolId) : undefined;
  const addRecentTool = useAppStore((s) => s.addRecentTool);

  useEffect(() => {
    if (tool) {
      addRecentTool(tool.id);
    }
  }, [tool, addRecentTool]);

  const LazyComponent = useMemo(() => {
    if (!tool) return null;
    return lazy(tool.component);
  }, [tool]);

  if (!tool || !LazyComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">{t('common.toolNotFound')}</p>
      </div>
    );
  }

  return (
    <ToolDraftBoundary key={`${tool.id}:${location.key}`} toolId={tool.id}>
    <ErrorBoundary key={tool.id} fallbackTitle={t('common.loadingToolError', { name: getToolCopy(tool, t).name })}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
    </ToolDraftBoundary>
  );
}

export { ToolPage };
