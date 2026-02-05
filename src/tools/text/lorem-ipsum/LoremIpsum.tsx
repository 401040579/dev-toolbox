import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { generateLoremIpsum } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type GenerationType = 'paragraphs' | 'sentences' | 'words';

export default function LoremIpsum() {
  const { t } = useTranslation();
  const [type, setType] = useState<GenerationType>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState('');

  const generate = useCallback(() => {
    const result = generateLoremIpsum(count, type, startWithLorem);
    setOutput(result);
  }, [count, type, startWithLorem]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.loremIpsum.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.loremIpsum.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.loremIpsum.typeLabel')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GenerationType)}
              className="w-40"
            >
              <option value="paragraphs">{t('tools.loremIpsum.paragraphs')}</option>
              <option value="sentences">{t('tools.loremIpsum.sentences')}</option>
              <option value="words">{t('tools.loremIpsum.words')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.loremIpsum.countLabel')}
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
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary">{t('tools.loremIpsum.startWithLorem')}</span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          {t('tools.loremIpsum.generate')}
        </button>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.loremIpsum.outputLabel')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-64 resize-none bg-surface"
            />
          </div>
        )}
      </div>
    </div>
  );
}
