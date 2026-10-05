import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DraftContext } from '@/drafts/context';
import { clearAllDrafts, clearToolDraft, draftsEnabled, getDraftStatus, setDraftsEnabled, subscribeDrafts } from '@/drafts/store';
import { consumeToolInput, peekToolInput } from '@/lib/tool-handoff';

export function ToolDraftBoundary({ toolId, children }: { toolId: string; children: ReactNode }) {
  const { t } = useTranslation();
  const textTransfer = toolId === 'qr-text-transfer';
  const enabled = useSyncExternalStore(subscribeDrafts, draftsEnabled);
  const status = useSyncExternalStore(subscribeDrafts, () => getDraftStatus(toolId));
  const [incoming] = useState(() => peekToolInput(toolId));
  useEffect(() => { consumeToolInput(toolId); }, [toolId]);
  const [generation, setGeneration] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState(false);

  const reset = (all: boolean) => {
    const success = all ? clearAllDrafts() : clearToolDraft(toolId);
    setError(!success);
    if (success) { setCleared(true); setGeneration((value) => value + 1); }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-6 py-2 border-b border-border bg-surface text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
          <input type="checkbox" checked={enabled} onChange={(event) => setError(!setDraftsEnabled(event.target.checked))} />
          {t('drafts.enabled')}
        </label>
        <span role="status" className="text-text-muted flex-1 min-w-28">{enabled ? t(textTransfer && status === 'empty' ? 'tools.qrTextTransfer.settingsDraft' : `drafts.status.${status}`) : t('drafts.disabled')}</span>
        <button onClick={() => reset(false)} className="text-text-secondary hover:text-accent">{t('drafts.clearCurrent')}</button>
        <button onClick={() => reset(true)} className="text-text-muted hover:text-accent">{t('drafts.clearAll')}</button>
        <span className="w-full text-text-muted">{t(textTransfer ? 'tools.qrTextTransfer.draftNotice' : 'drafts.notice')}</span>
        {error && <p role="alert" className="w-full text-error">{t('drafts.storageError')}</p>}
      </div>
      <DraftContext.Provider value={{ toolId, incoming: generation === 0 ? incoming : undefined, cleared }}>
        <div key={generation} className="flex-1 min-h-0">{children}</div>
      </DraftContext.Provider>
    </div>
  );
}
