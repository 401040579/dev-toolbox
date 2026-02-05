import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { csvToJson, jsonToCsv } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const SAMPLE_CSV = `name,email,age,city
John Doe,john@example.com,30,New York
Jane Smith,jane@example.com,25,Los Angeles
Bob Johnson,bob@example.com,35,Chicago`;

const SAMPLE_JSON = `[
  { "name": "John Doe", "email": "john@example.com", "age": 30, "city": "New York" },
  { "name": "Jane Smith", "email": "jane@example.com", "age": 25, "city": "Los Angeles" },
  { "name": "Bob Johnson", "email": "bob@example.com", "age": 35, "city": "Chicago" }
]`;

type Mode = 'csv-to-json' | 'json-to-csv';

export default function CsvJson() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_CSV);
  const [mode, setMode] = useState<Mode>('csv-to-json');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [error, setError] = useState('');

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setInput(newMode === 'csv-to-json' ? SAMPLE_CSV : SAMPLE_JSON);
    setError('');
  };

  const output = useMemo(() => {
    if (!input.trim()) return '';
    setError('');
    try {
      return mode === 'csv-to-json'
        ? csvToJson(input, { delimiter, hasHeader })
        : jsonToCsv(input, { delimiter });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tools.csvJson.error'));
      return '';
    }
  }, [input, mode, delimiter, hasHeader, t]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.csvJson.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.csvJson.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => handleModeChange('csv-to-json')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'csv-to-json' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              CSV → JSON
            </button>
            <button
              onClick={() => handleModeChange('json-to-csv')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'json-to-csv' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              JSON → CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">{t('tools.csvJson.delimiter')}:</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="text-sm w-24"
            >
              <option value=",">{t('tools.csvJson.comma')}</option>
              <option value=";">{t('tools.csvJson.semicolon')}</option>
              <option value={'\t'}>{t('tools.csvJson.tab')}</option>
              <option value="|">{t('tools.csvJson.pipe')}</option>
            </select>
          </div>

          {mode === 'csv-to-json' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.csvJson.hasHeader')}</span>
            </label>
          )}
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {mode === 'csv-to-json' ? t('tools.csvJson.csvInput') : t('tools.csvJson.jsonInput')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'csv-to-json' ? t('tools.csvJson.csvPlaceholder') : t('tools.csvJson.jsonPlaceholder')}
            className="w-full h-40 resize-none font-mono text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {mode === 'csv-to-json' ? t('tools.csvJson.jsonOutput') : t('tools.csvJson.csvOutput')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-48 resize-none font-mono text-sm bg-surface"
            />
          </div>
        )}
      </div>
    </div>
  );
}
