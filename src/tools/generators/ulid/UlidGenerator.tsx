import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateULIDs, parseULID, isValidULID } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function UlidGenerator() {
  const { t } = useTranslation();
  const [count, setCount] = useState(5);
  const [ulids, setUlids] = useState<string[]>(() => generateULIDs(5));
  const [parseInput, setParseInput] = useState('');

  const handleGenerate = () => {
    setUlids(generateULIDs(count));
  };

  const parsed = parseInput ? parseULID(parseInput.trim()) : null;
  const isValid = parseInput ? isValidULID(parseInput.trim()) : true;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.ulid.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.ulid.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Generate Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.ulid.count')}
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                min={1}
                max={100}
                className="w-24"
              />
            </div>
            <div className="self-end">
              <button onClick={handleGenerate} className="btn btn-primary">
                {t('tools.ulid.generate')}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.ulid.output')}
              </label>
              <CopyButton text={ulids.join('\n')} />
            </div>
            <textarea
              readOnly
              value={ulids.join('\n')}
              className="w-full h-40 resize-none font-mono text-sm bg-surface"
            />
          </div>
        </div>

        {/* Parse Section */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-text-primary">{t('tools.ulid.parseTitle')}</h2>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.ulid.parseInput')}
            </label>
            <input
              type="text"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="01ARZ3NDEKTSV4RRFFQ69G5FAV"
              className={`w-full font-mono ${!isValid ? 'border-error' : ''}`}
            />
            {!isValid && (
              <p className="text-sm text-error mt-1">{t('tools.ulid.invalidUlid')}</p>
            )}
          </div>

          {parsed && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  {t('tools.ulid.timestamp')}
                </p>
                <p className="font-mono text-sm">{parsed.timestamp}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  {t('tools.ulid.date')}
                </p>
                <p className="font-mono text-sm">{parsed.date.toISOString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-sm text-text-secondary space-y-2">
          <p><strong>{t('tools.ulid.formatTitle')}:</strong> {t('tools.ulid.formatDesc')}</p>
          <p className="font-mono text-xs bg-surface-alt p-2 rounded">
            01ARZ3NDEKTSV4RRFFQ69G5FAV<br/>
            └──────┘└───────────────┘<br/>
            &nbsp;Timestamp&nbsp;&nbsp;&nbsp;Randomness<br/>
            &nbsp;&nbsp;(10 chars)&nbsp;&nbsp;(16 chars)
          </p>
        </div>
      </div>
    </div>
  );
}
