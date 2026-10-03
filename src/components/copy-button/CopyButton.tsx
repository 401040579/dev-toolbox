import { Check, Copy, AlertCircle } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: number;
}

export function CopyButton({ text, className, size = 16 }: CopyButtonProps) {
  const { t } = useTranslation();
  const { copied, failed, copy } = useCopyToClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className={cn(
        'p-1.5 rounded-md inline-flex items-center gap-1 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all',
        copied && 'text-success',
        failed && 'text-error',
        className,
      )}
      aria-label={copied ? t('common.copied') : t('common.copyToClipboard')}
      title={failed ? t('common.copyFailed') : copied ? t('common.copied') : t('common.copyToClipboard')}
    >
      {failed ? <AlertCircle size={size} /> : copied ? <Check size={size} /> : <Copy size={size} />}
      {failed && <span role="alert" className="text-xs">{t('common.copyError')}</span>}
    </button>
  );
}
