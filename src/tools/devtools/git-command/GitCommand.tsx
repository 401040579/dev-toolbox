import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchCommands } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function GitCommand() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const results = searchCommands(query);
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

        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{cat}</h3>
            <div className="space-y-1">
              {results
                .filter((r) => r.category === cat)
                .map((cmd, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-surface-alt group">
                    <code className="text-sm font-mono text-accent flex-shrink-0">{cmd.command}</code>
                    <span className="text-sm text-text-secondary flex-1">{cmd.description}</span>
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
