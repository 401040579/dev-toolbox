import { useDraftState } from '@/hooks/useDraftState';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { convertJsonYaml, type JsonYamlMode } from './conversion';

export default function JsonYaml() {
  const { t } = useTranslation();
  const [input, setInput] = useDraftState('input', '', { clearValue: '' });
  const [mode, setMode] = useDraftState<JsonYamlMode>('mode', 'json-to-yaml', { allowed: ["json-to-yaml","yaml-to-json"] });

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null };
    try {
      return { output: convertJsonYaml(input, mode), error: null };
    } catch (e) {
      return { output: '', error: (e as Error).message };
    }
  }, [input, mode]);

  return (
    <ToolLayout
      toolId="json-yaml"
      title={t('tools.jsonYaml.title')}
      description={t('tools.jsonYaml.description')}
      actions={
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setMode('json-to-yaml')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'json-to-yaml'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.jsonYaml.jsonToYaml')}
          </button>
          <button
            onClick={() => setMode('yaml-to-json')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'yaml-to-json'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.jsonYaml.yamlToJson')}
          </button>
        </div>
      }
      input={
        <div className="flex flex-col h-full gap-2">
          <p className="text-xs text-text-muted">{t('tools.jsonYaml.supportedNote')}</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'json-to-yaml' ? t('tools.jsonYaml.jsonPlaceholder') : t('tools.jsonYaml.yamlPlaceholder')}
            className="w-full flex-1 min-h-[200px] resize-none bg-transparent font-mono text-sm outline-none"
            spellCheck={false}
          />
        </div>
      }
      output={
        <div className="relative h-full">
          {error ? (
            <div role="alert" className="text-error text-sm">
              <p>{t('tools.jsonYaml.error')}</p>
              <pre className="mt-1 font-mono whitespace-pre-wrap break-all text-xs">{error}</pre>
            </div>
          ) : output ? (
            <>
              <div className="absolute right-0 top-0">
                <CopyButton text={output} />
              </div>
              <pre className="font-mono text-sm whitespace-pre overflow-x-auto pr-10">{output}</pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">{t('common.outputPlaceholder')}</p>
          )}
        </div>
      }
    />
  );
}
