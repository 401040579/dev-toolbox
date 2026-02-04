import { X, GripVertical, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getTransform } from '@/tools/registry';
import { usePipelineStore } from './store';
import type { PipelineNode as PipelineNodeType } from './types';
import { cn } from '@/lib/utils';

interface Props {
  node: PipelineNodeType;
  index: number;
}

export function PipelineNodeCard({ node, index }: Props) {
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
        <GripVertical size={14} className="text-text-muted cursor-grab shrink-0" />
        <span className="text-xs text-text-muted font-mono w-5">{index + 1}</span>
        <span className="text-sm font-medium text-text-primary flex-1 truncate">
          {transform?.name ?? node.transformId}
        </span>
        {statusIcon}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={() => removeNode(node.id)}
          className="p-1 text-text-muted hover:text-error transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
          {transform?.description && (
            <p className="text-xs text-text-muted">{transform.description}</p>
          )}

          {/* Options */}
          {transform?.options?.map((opt) => (
            <div key={opt.key} className="flex items-center gap-2">
              <label className="text-xs text-text-secondary w-24 shrink-0">{opt.label}</label>
              {opt.type === 'select' && opt.choices ? (
                <select
                  value={String(node.options[opt.key] ?? opt.default)}
                  onChange={(e) => setNodeOption(node.id, opt.key, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-border bg-surface text-text-primary"
                >
                  {opt.choices.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              ) : opt.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={Boolean(node.options[opt.key] ?? opt.default)}
                  onChange={(e) => setNodeOption(node.id, opt.key, e.target.checked)}
                />
              ) : (
                <input
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
              <div className="text-xs text-text-muted mb-1">Output preview:</div>
              <pre className="text-xs font-mono text-text-secondary bg-background rounded p-2 max-h-24 overflow-auto">
                {node.output.slice(0, 500)}
                {node.output.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}
          {node.error && (
            <div className="text-xs text-error mt-1">{node.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
