import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { convert, ConversionMode } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const SAMPLE_TOML = `# Configuration file
title = "My App"
version = "1.0.0"

[server]
host = "localhost"
port = 8080
debug = true

[database]
driver = "postgresql"
host = "localhost"
port = 5432
name = "myapp"

[features]
enabled = ["auth", "logging", "cache"]`;

export default function TomlConverter() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_TOML);
  const [mode, setMode] = useState<ConversionMode>('toml-to-json');
  const [error, setError] = useState('');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    setError('');
    try {
      return convert(input, mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tools.tomlConverter.error'));
      return '';
    }
  }, [input, mode, t]);

  const getPlaceholder = () => {
    switch (mode) {
      case 'toml-to-json':
      case 'toml-to-yaml':
        return t('tools.tomlConverter.tomlPlaceholder');
      case 'json-to-toml':
        return t('tools.tomlConverter.jsonPlaceholder');
      case 'yaml-to-toml':
        return t('tools.tomlConverter.yamlPlaceholder');
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.tomlConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.tomlConverter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Mode Selection */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('toml-to-json')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'toml-to-json'
                ? 'bg-accent-muted text-accent'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            TOML → JSON
          </button>
          <button
            onClick={() => setMode('json-to-toml')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'json-to-toml'
                ? 'bg-accent-muted text-accent'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            JSON → TOML
          </button>
          <button
            onClick={() => setMode('toml-to-yaml')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'toml-to-yaml'
                ? 'bg-accent-muted text-accent'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            TOML → YAML
          </button>
          <button
            onClick={() => setMode('yaml-to-toml')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'yaml-to-toml'
                ? 'bg-accent-muted text-accent'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            YAML → TOML
          </button>
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.tomlConverter.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
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
                {t('tools.tomlConverter.outputLabel')}
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
