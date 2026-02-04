import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from '@/components/copy-button/CopyButton';

const CASES = [
  { id: 'uppercase', fn: (s: string) => s.toUpperCase() },
  { id: 'lowercase', fn: (s: string) => s.toLowerCase() },
  { id: 'titleCase', fn: (s: string) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) },
  { id: 'camelCase', fn: (s: string) => s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^[A-Z]/, (c) => c.toLowerCase()) },
  { id: 'pascalCase', fn: (s: string) => s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^[a-z]/, (c) => c.toUpperCase()) },
  { id: 'snakeCase', fn: (s: string) => s.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s\-]+/g, '_').toLowerCase() },
  { id: 'kebabCase', fn: (s: string) => s.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase() },
  { id: 'constantCase', fn: (s: string) => s.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s\-]+/g, '_').toUpperCase() },
] as const;

export default function CaseConverter() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const results = useMemo(() => {
    if (!input) return [];
    return CASES.map((c) => ({ ...c, output: c.fn(input) }));
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.caseConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {t('tools.caseConverter.description')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.caseConverter.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.caseConverter.placeholder')}
            className="w-full min-h-[80px] resize-y"
            spellCheck={false}
          />
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-text-muted">{t(`tools.caseConverter.cases.${r.id}`)}</span>
                  <CopyButton text={r.output} size={14} />
                </div>
                <code className="font-mono text-sm text-text-primary break-all">{r.output}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
