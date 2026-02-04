import { useEffect, useCallback, useRef } from 'react';
import { Plus, Play, Share2, Trash2, BookTemplate } from 'lucide-react';
import { usePipelineStore } from './store';
import { executePipeline } from './engine';
import { getPipelineShareUrl, deserializePipeline } from './serializer';
import { PipelineNodeCard } from './PipelineNode';
import { getAllTransforms } from '@/tools/registry';
import { PIPELINE_TEMPLATES } from './templates';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useState } from 'react';

export default function PipelinePage() {
  const { nodes, input, setInput, addNode, clearPipeline, loadPipeline } = usePipelineStore();
  const allTransforms = getAllTransforms();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { copy: copyUrl, copied: urlCopied } = useCopyToClipboard();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load pipeline from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#config=')) {
      const encoded = hash.slice('#config='.length);
      const data = deserializePipeline(encoded);
      if (data) {
        loadPipeline(data.nodes, data.input);
      }
    }
  }, [loadPipeline]);

  // Auto-execute on changes with debounce
  useEffect(() => {
    if (nodes.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executePipeline();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, input]);

  const handleShare = useCallback(() => {
    const url = getPipelineShareUrl(nodes, input);
    if (url) {
      copyUrl(url);
    }
  }, [nodes, input, copyUrl]);

  const lastNode = nodes[nodes.length - 1];
  const finalOutput = lastNode?.output ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Pipeline Builder</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Chain transforms together to process data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <BookTemplate size={14} />
            Templates
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
            disabled={nodes.length === 0}
          >
            <Share2 size={14} />
            {urlCopied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={clearPipeline}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-error hover:border-error/30 transition-colors"
            disabled={nodes.length === 0}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Input panel */}
        <div className="flex flex-col lg:w-80 border-b lg:border-b-0 lg:border-r border-border">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            Input
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter input data..."
            className="flex-1 p-4 resize-none bg-transparent font-mono text-sm outline-none min-h-[120px]"
            spellCheck={false}
          />
        </div>

        {/* Pipeline nodes */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
            <span>Pipeline ({nodes.length} nodes)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => executePipeline()}
                disabled={nodes.length === 0}
                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-accent text-background hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                <Play size={12} />
                Run
              </button>
            </div>
          </div>

          {/* Templates dropdown */}
          {showTemplates && (
            <div className="border-b border-border p-3 bg-surface space-y-2">
              <div className="text-xs font-medium text-text-muted">Quick start templates:</div>
              {PIPELINE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    loadPipeline(tpl.nodes, tpl.sampleInput);
                    setShowTemplates(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md border border-border hover:border-border-strong hover:bg-surface-hover transition-colors"
                >
                  <div className="text-sm font-medium text-text-primary">{tpl.name}</div>
                  <div className="text-xs text-text-muted">{tpl.description}</div>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {nodes.map((node, i) => (
              <PipelineNodeCard key={node.id} node={node} index={i} />
            ))}

            {/* Add node */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-border text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-sm"
              >
                <Plus size={14} />
                Add transform
              </button>

              {showAddMenu && (
                <div className="absolute z-10 top-full mt-1 left-0 right-0 max-h-64 overflow-auto rounded-lg border border-border bg-surface shadow-lg">
                  {allTransforms.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        addNode(t.id);
                        setShowAddMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-surface-hover transition-colors border-b border-border last:border-0"
                    >
                      <div className="text-sm text-text-primary">{t.name}</div>
                      <div className="text-xs text-text-muted">{t.description}</div>
                    </button>
                  ))}
                  {allTransforms.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-text-muted">
                      No transforms available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output panel */}
        <div className="flex flex-col lg:w-80 border-t lg:border-t-0 lg:border-l border-border">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
            <span>Output</span>
            {finalOutput && <CopyButton text={finalOutput} size={14} />}
          </div>
          <pre className="flex-1 p-4 font-mono text-sm text-text-primary overflow-auto whitespace-pre-wrap break-all min-h-[120px]">
            {finalOutput || (
              <span className="text-text-muted">Pipeline output will appear here</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
