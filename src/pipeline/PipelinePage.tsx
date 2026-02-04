import { useEffect, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Play, Share2, Trash2, BookTemplate, Save, FolderOpen, X } from 'lucide-react';
import { usePipelineStore, useSavedPipelinesStore } from './store';
import { executePipeline } from './engine';
import { getPipelineShareUrl, deserializePipeline } from './serializer';
import { PipelineNodeCard } from './PipelineNode';
import { getAllTransforms } from '@/tools/registry';
import { PIPELINE_TEMPLATES } from './templates';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

export default function PipelinePage() {
  const { t } = useTranslation();
  const { nodes, input, setInput, addNode, clearPipeline, loadPipeline } = usePipelineStore();
  const allTransforms = getAllTransforms();
  const { saved, savePipeline, deleteSavedPipeline } = useSavedPipelinesStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border gap-2">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('pipeline.title')}</h1>
          <p className="text-sm text-text-secondary mt-0.5 hidden sm:block">
            {t('pipeline.description')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setShowTemplates((v) => !v)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors shrink-0"
            title={t('pipeline.templates')}
          >
            <BookTemplate size={14} />
            <span className="hidden sm:inline">{t('pipeline.templates')}</span>
          </button>
          <button
            onClick={() => setShowSaved((v) => !v)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors shrink-0"
            title={t('pipeline.saved')}
          >
            <FolderOpen size={14} />
            <span className="hidden sm:inline">{t('pipeline.saved')}{saved.length > 0 ? ` (${saved.length})` : ''}</span>
          </button>
          <button
            onClick={() => { setSaveName(''); setShowSaveDialog(true); }}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors shrink-0"
            disabled={nodes.length === 0}
            title={t('pipeline.save')}
          >
            <Save size={14} />
            <span className="hidden sm:inline">{t('pipeline.save')}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors shrink-0"
            disabled={nodes.length === 0}
            title={t('pipeline.share')}
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">{urlCopied ? t('pipeline.copied') : t('pipeline.share')}</span>
          </button>
          <button
            onClick={clearPipeline}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:text-error hover:border-error/30 transition-colors shrink-0"
            disabled={nodes.length === 0}
            title={t('pipeline.clear')}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">{t('pipeline.clear')}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Input panel */}
        <div className="flex flex-col lg:w-80 border-b lg:border-b-0 lg:border-r border-border">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
            {t('pipeline.input')}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('pipeline.inputPlaceholder')}
            className="flex-1 p-4 resize-none bg-transparent font-mono text-sm outline-none min-h-[120px]"
            spellCheck={false}
          />
        </div>

        {/* Pipeline nodes */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
            <span>{t('pipeline.nodes', { count: nodes.length })}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => executePipeline()}
                disabled={nodes.length === 0}
                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-accent text-background hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                <Play size={12} />
                {t('pipeline.run')}
              </button>
            </div>
          </div>

          {/* Save dialog */}
          {showSaveDialog && (
            <div className="border-b border-border p-3 bg-surface">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={t('pipeline.saveName')}
                  className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-background"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && saveName.trim()) {
                      savePipeline(saveName.trim(), nodes, input);
                      setShowSaveDialog(false);
                    }
                    if (e.key === 'Escape') setShowSaveDialog(false);
                  }}
                />
                <button
                  onClick={() => {
                    if (saveName.trim()) {
                      savePipeline(saveName.trim(), nodes, input);
                      setShowSaveDialog(false);
                    }
                  }}
                  disabled={!saveName.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-background hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {t('pipeline.save')}
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Saved pipelines dropdown */}
          {showSaved && (
            <div className="border-b border-border p-3 bg-surface space-y-2">
              <div className="text-xs font-medium text-text-muted">{t('pipeline.savedPipelines')}</div>
              {saved.length === 0 ? (
                <div className="text-xs text-text-muted py-2 text-center">{t('pipeline.noSaved')}</div>
              ) : (
                saved.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-border-strong hover:bg-surface-hover transition-colors"
                  >
                    <button
                      onClick={() => {
                        loadPipeline(p.nodes, p.input);
                        setShowSaved(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-medium text-text-primary">{p.name}</div>
                      <div className="text-xs text-text-muted">
                        {t('pipeline.nodesInfo', { count: p.nodes.length })} · {new Date(p.savedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => deleteSavedPipeline(p.id)}
                      className="p-1 rounded text-text-muted hover:text-error transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Templates dropdown */}
          {showTemplates && (
            <div className="border-b border-border p-3 bg-surface space-y-2">
              <div className="text-xs font-medium text-text-muted">{t('pipeline.quickStart')}</div>
              {PIPELINE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    loadPipeline(tpl.nodes, tpl.sampleInput);
                    setShowTemplates(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md border border-border hover:border-border-strong hover:bg-surface-hover transition-colors"
                >
                  <div className="text-sm font-medium text-text-primary">{t(`pipelineTemplates.${tpl.id}.name`)}</div>
                  <div className="text-xs text-text-muted">{t(`pipelineTemplates.${tpl.id}.description`)}</div>
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
                {t('pipeline.addTransform')}
              </button>

              {showAddMenu && (
                <div className="absolute z-10 top-full mt-1 left-0 right-0 max-h-64 overflow-auto rounded-lg border border-border bg-surface shadow-lg">
                  {allTransforms.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => {
                        addNode(tr.id);
                        setShowAddMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-surface-hover transition-colors border-b border-border last:border-0"
                    >
                      <div className="text-sm text-text-primary">{tr.name}</div>
                      <div className="text-xs text-text-muted">{tr.description}</div>
                    </button>
                  ))}
                  {allTransforms.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-text-muted">
                      {t('pipeline.noTransforms')}
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
            <span>{t('pipeline.output')}</span>
            {finalOutput && <CopyButton text={finalOutput} size={14} />}
          </div>
          <pre className="flex-1 p-4 font-mono text-sm text-text-primary overflow-auto whitespace-pre-wrap break-all min-h-[120px]">
            {finalOutput || (
              <span className="text-text-muted">{t('pipeline.outputPlaceholder')}</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
