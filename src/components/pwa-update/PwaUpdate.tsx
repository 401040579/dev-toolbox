import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

export function PwaUpdate() {
  const { t } = useTranslation();
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto z-50 rounded-lg border border-accent-muted bg-surface p-4 shadow-lg space-y-2 max-w-md">
      <p className="text-sm text-text-primary">{t('common.updateReady')}</p>
      <p className="text-xs text-text-secondary">{t('common.updateNotice')}</p>
      <button className="btn btn-primary" onClick={() => updateServiceWorker(true)}>{t('common.updateReload')}</button>
    </div>
  );
}
