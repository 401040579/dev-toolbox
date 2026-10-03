import { X, GripVertical, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getTransform } from '@/tools/registry';
import { usePipelineStore } from './store';
import type { PipelineNode as PipelineNodeType } from './types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { getTransformCopy } from '@/i18n/tool-copy';

interface Props {
  node: PipelineNodeType;
  index: number;
}

export function PipelineNodeCard({ node, index }: Props) {
  const { t } = useTranslation();
  const { removeNode, setNodeOption } = usePipelineStore();
  const [expanded, setExpanded] = useState(false);
  const transform = getTransform(node.transformId);

  const statusIcon = {
    idle: null,
    running: <Loader2 size={14} className="animate-spin text-info" />,
    success: <CheckCircle2 size={14} className="text-success" />,
    error: <AlertCircle size={14} className="text-error" />,
    'upstream-error': <AlertCircle size={14} className="text-warning" />,
  }[node.status];

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface transition-colors',
        node.status === 'error' ? 'border-error/50' : 'border-border',
        node.status === 'success' ? 'border-success/30' : '',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical size={14} className="text-text-muted shrink-0" />
        <span className="text-xs text-text-muted font-mono w-5">{index + 1}</span>
        <span className="text-sm font-medium text-text-primary flex-1 truncate">
          {transform ? getTransformCopy(transform, t).name : node.transformId}
        </span>
        {statusIcon}
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? t('common.collapse') : t('common.expand')}
          aria-expanded={expanded}
          className="p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={() => removeNode(node.id)}
          aria-label={t('pipeline.removeNode', { count: index + 1 })}
          className="p-1 text-text-muted hover:text-error transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
          {transform?.description && (
            <p className="text-xs text-text-muted">{getTransformCopy(transform, t).description}</p>
          )}

          {/* Options */}
          {transform?.options?.map((opt) => (
            <div key={opt.key} className="flex items-center gap-2">
              <label htmlFor={`${node.id}-${opt.key}`} className="text-xs text-text-secondary w-24 shrink-0">{t(`transforms.${transform.id}.options.${opt.key}.label`)}</label>
              {opt.type === 'select' && opt.choices ? (
                <select
                  id={`${node.id}-${opt.key}`}
                  value={String(node.options[opt.key] ?? opt.default)}
                  onChange={(e) => setNodeOption(node.id, opt.key, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-border bg-surface text-text-primary"
                >
                  {opt.choices.map((c, choiceIndex) => (
                    <option key={c.value} value={c.value}>
                      {t(`transforms.${transform.id}.options.${opt.key}.choices.${choiceIndex}`)}
                    </option>
                  ))}
                </select>
              ) : opt.type === 'boolean' ? (
                <input
                  id={`${node.id}-${opt.key}`}
                  type="checkbox"
                  checked={Boolean(node.options[opt.key] ?? opt.default)}
                  onChange={(e) => setNodeOption(node.id, opt.key, e.target.checked)}
                />
              ) : (
                <input
                  id={`${node.id}-${opt.key}`}
                  type="text"
                  value={String(node.options[opt.key] ?? opt.default)}
                  onChange={(e) => setNodeOption(node.id, opt.key, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-border bg-surface text-text-primary flex-1"
                />
              )}
            </div>
          ))}

          {/* Output preview */}
          {node.output && (
            <div className="mt-2">
              <div className="text-xs text-text-muted mb-1">{t('pipeline.outputPreview')}</div>
              <pre className="text-xs font-mono text-text-secondary bg-background rounded p-2 max-h-24 overflow-auto">
                {node.output.slice(0, 500)}
                {node.output.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}
          {node.error && (
            <div role="alert" className="text-xs text-error mt-1">
              {node.status === 'upstream-error' ? t('pipeline.upstreamError') : !transform ? t('pipeline.transformNotFound', { id: node.transformId }) : t('pipeline.stepFailed')}
              {transform && node.status === 'error' && <pre className="whitespace-pre-wrap break-all mt-1">{node.error}</pre>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
