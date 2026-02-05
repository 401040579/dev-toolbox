import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseQueryString, buildQueryString } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'parse' | 'build';

interface ParamRow {
  key: string;
  value: string;
}

export default function QueryString() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('parse');
  const [input, setInput] = useState('');
  const [params, setParams] = useState<ParamRow[]>([{ key: '', value: '' }]);

  const parsed = useMemo(() => {
    if (mode !== 'parse' || !input.trim()) return null;
    try {
      return parseQueryString(input);
    } catch {
      return null;
    }
  }, [mode, input]);

  const built = useMemo(() => {
    if (mode !== 'build') return '';
    const paramsObj: Record<string, string[]> = {};
    params.forEach(({ key, value }) => {
      if (!key) return;
      if (!paramsObj[key]) {
        paramsObj[key] = [];
      }
      paramsObj[key]!.push(value);
    });
    return buildQueryString(paramsObj);
  }, [mode, params]);

  const addParam = () => {
    setParams([...params, { key: '', value: '' }]);
  };

  const updateParam = (index: number, field: 'key' | 'value', newValue: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index]!, [field]: newValue };
    setParams(newParams);
  };

  const removeParam = (index: number) => {
    if (params.length > 1) {
      setParams(params.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.queryString.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.queryString.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => setMode('parse')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'parse'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.queryString.parse')}
          </button>
          <button
            onClick={() => setMode('build')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'build'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.queryString.build')}
          </button>
        </div>

        {mode === 'parse' && (
          <>
            {/* Input */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.queryString.inputLabel')}
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('tools.queryString.inputPlaceholder')}
                className="w-full font-mono"
              />
            </div>

            {/* Parsed Results */}
            {parsed && Object.keys(parsed).length > 0 && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-alt">
                    <tr>
                      <th className="px-4 py-2 text-left text-text-muted font-medium">Key</th>
                      <th className="px-4 py-2 text-left text-text-muted font-medium">Value</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(parsed).map(([key, values]) =>
                      values.map((value, i) => (
                        <tr key={`${key}-${i}`}>
                          <td className="px-4 py-2 font-mono text-text-secondary">{key}</td>
                          <td className="px-4 py-2 font-mono break-all">{value}</td>
                          <td className="px-4 py-2">
                            <CopyButton text={value} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {parsed && Object.keys(parsed).length === 0 && (
              <p className="text-sm text-text-muted">{t('tools.queryString.noParams')}</p>
            )}
          </>
        )}

        {mode === 'build' && (
          <>
            {/* Parameter Builder */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.queryString.paramsLabel')}
              </label>
              {params.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateParam(index, 'key', e.target.value)}
                    placeholder="key"
                    className="flex-1 font-mono"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateParam(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 font-mono"
                  />
                  <button
                    onClick={() => removeParam(index)}
                    className="px-3 py-2 text-text-muted hover:text-error transition-colors"
                    disabled={params.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addParam}
                className="px-3 py-1 text-sm bg-surface-alt hover:bg-border rounded transition-colors"
              >
                + {t('tools.queryString.addParam')}
              </button>
            </div>

            {/* Built Result */}
            {built && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                    {t('tools.queryString.outputLabel')}
                  </label>
                  <CopyButton text={built} />
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface font-mono text-sm break-all">
                  ?{built}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
