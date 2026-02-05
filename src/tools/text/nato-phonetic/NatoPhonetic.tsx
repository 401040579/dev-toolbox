import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toNatoPhonetic, fromNatoPhonetic, getNatoAlphabet } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'toNato' | 'fromNato';
type Tab = 'converter' | 'reference';

export default function NatoPhonetic() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('converter');
  const [mode, setMode] = useState<Mode>('toNato');
  const [input, setInput] = useState('');

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'toNato' ? toNatoPhonetic(input) : fromNatoPhonetic(input);
  }, [input, mode]);

  const alphabet = getNatoAlphabet();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.natoPhonetic.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.natoPhonetic.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'converter'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.natoPhonetic.tabConverter')}
          </button>
          <button
            onClick={() => setActiveTab('reference')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'reference'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.natoPhonetic.tabReference')}
          </button>
        </div>

        {activeTab === 'converter' && (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
              <button
                onClick={() => setMode('toNato')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'toNato' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t('tools.natoPhonetic.toNato')}
              </button>
              <button
                onClick={() => setMode('fromNato')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'fromNato' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t('tools.natoPhonetic.fromNato')}
              </button>
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.natoPhonetic.inputLabel')}
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'toNato'
                  ? t('tools.natoPhonetic.inputPlaceholder')
                  : t('tools.natoPhonetic.natoPlaceholder')}
                className="w-full font-mono"
              />
            </div>

            {/* Output */}
            {output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                    {t('tools.natoPhonetic.outputLabel')}
                  </label>
                  <CopyButton text={output} />
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface font-mono text-sm">
                  {output}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reference' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {alphabet.map(({ letter, word }) => (
              <div
                key={letter}
                className="flex items-center gap-3 p-2 rounded-lg border border-border bg-surface"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded bg-accent-muted text-accent font-bold">
                  {letter}
                </span>
                <span className="text-sm font-medium">{word}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
