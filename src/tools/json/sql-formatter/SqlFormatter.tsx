import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatSQL, minifySQL } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type SqlDialect = 'standard' | 'mysql' | 'postgresql' | 'sqlite';

const SAMPLE_SQL = `select id, name, email from users where status = 'active' and created_at > '2024-01-01' order by name asc limit 10`;

export default function SqlFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_SQL);
  const [dialect, setDialect] = useState<SqlDialect>('standard');
  const [indent, setIndent] = useState('  ');
  const [uppercase, setUppercase] = useState(true);
  const [mode, setMode] = useState<'format' | 'minify'>('format');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return mode === 'format'
        ? formatSQL(input, { dialect, indent, uppercase })
        : minifySQL(input);
    } catch {
      return t('tools.sqlFormatter.error');
    }
  }, [input, dialect, indent, uppercase, mode, t]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.sqlFormatter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.sqlFormatter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode('format')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'format' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.sqlFormatter.format')}
            </button>
            <button
              onClick={() => setMode('minify')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'minify' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('tools.sqlFormatter.minify')}
            </button>
          </div>

          {mode === 'format' && (
            <>
              <div>
                <select
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as SqlDialect)}
                  className="text-sm"
                >
                  <option value="standard">{t('tools.sqlFormatter.dialectStandard')}</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              <div>
                <select
                  value={indent}
                  onChange={(e) => setIndent(e.target.value)}
                  className="text-sm"
                >
                  <option value="  ">{t('tools.sqlFormatter.twoSpaces')}</option>
                  <option value="    ">{t('tools.sqlFormatter.fourSpaces')}</option>
                  <option value={'\t'}>{t('tools.sqlFormatter.tab')}</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-text-secondary">{t('tools.sqlFormatter.uppercase')}</span>
              </label>
            </>
          )}
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.sqlFormatter.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.sqlFormatter.inputPlaceholder')}
            className="w-full h-32 resize-none font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.sqlFormatter.outputLabel')}
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            value={output}
            className="w-full h-48 resize-none font-mono text-sm bg-surface"
          />
        </div>
      </div>
    </div>
  );
}
