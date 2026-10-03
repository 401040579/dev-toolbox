import { useDraftState } from '@/hooks/useDraftState';
import { useTranslation } from 'react-i18next';
import { GIT_COMMANDS } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function GitCommand() {
  const { t } = useTranslation();
  const [query, setQuery] = useDraftState('query', '', { clearValue: '' });

  const q = query.trim().toLocaleLowerCase();
  const results = GIT_COMMANDS.filter((cmd) => [cmd.command, cmd.description, cmd.category, t(`tools.gitCommand.commands.${cmd.id}`), t(`tools.gitCommand.categories.${cmd.category}`)].some((value) => value.toLocaleLowerCase().includes(q)));
  const categories = [...new Set(results.map((r) => r.category))];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.gitCommand.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.gitCommand.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('tools.gitCommand.searchPlaceholder')}
          className="w-full"
        />

        {results.length === 0 && <p className="text-sm text-text-muted">{t('tools.gitCommand.noResults')}</p>}
        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{t(`tools.gitCommand.categories.${cat}`)}</h3>
            <div className="space-y-1">
              {results
                .filter((r) => r.category === cat)
                .map((cmd, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-surface-alt group">
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono text-accent break-all">{cmd.command}</code>
                      <p className="text-sm text-text-secondary mt-1">{t(`tools.gitCommand.commands.${cmd.id}`)}</p>
                    </div>
                    <CopyButton text={cmd.command} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
