import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateRandomStrings, generatePronounceable, StringType } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function RandomString() {
  const { t } = useTranslation();
  const [type, setType] = useState<StringType>('alphanumeric');
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [customChars, setCustomChars] = useState('');
  const [strings, setStrings] = useState<string[]>([]);

  const handleGenerate = () => {
    setStrings(generateRandomStrings(count, {
      type,
      length,
      uppercase,
      lowercase,
      customChars: type === 'custom' ? customChars : undefined,
    }));
  };

  const handleGeneratePronounceable = () => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(generatePronounceable(length));
    }
    setStrings(results);
  };

  const output = strings.join('\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.randomString.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.randomString.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomString.typeLabel')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as StringType)}
              className="w-40"
            >
              <option value="alphanumeric">{t('tools.randomString.typeAlphanumeric')}</option>
              <option value="alpha">{t('tools.randomString.typeAlpha')}</option>
              <option value="numeric">{t('tools.randomString.typeNumeric')}</option>
              <option value="hex">{t('tools.randomString.typeHex')}</option>
              <option value="binary">{t('tools.randomString.typeBinary')}</option>
              <option value="base64">{t('tools.randomString.typeBase64')}</option>
              <option value="custom">{t('tools.randomString.typeCustom')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomString.lengthLabel')}
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(Math.max(1, Math.min(256, parseInt(e.target.value) || 16)))}
              min={1}
              max={256}
              className="w-20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomString.countLabel')}
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              className="w-20"
            />
          </div>
        </div>

        {(type === 'alpha' || type === 'alphanumeric') && (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.randomString.uppercase')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('tools.randomString.lowercase')}</span>
            </label>
          </div>
        )}

        {type === 'custom' && (
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.randomString.customChars')}
            </label>
            <input
              type="text"
              value={customChars}
              onChange={(e) => setCustomChars(e.target.value)}
              placeholder="ABC123!@#..."
              className="w-full font-mono"
            />
          </div>
        )}

        {/* Length Presets */}
        <div className="flex flex-wrap gap-2">
          {[8, 12, 16, 24, 32, 64, 128].map((len) => (
            <button
              key={len}
              onClick={() => setLength(len)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                length === len
                  ? 'bg-accent-muted text-accent'
                  : 'bg-surface-alt hover:bg-border text-text-secondary'
              }`}
            >
              {len}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={handleGenerate} className="btn btn-primary">
            {t('tools.randomString.generate')}
          </button>
          <button onClick={handleGeneratePronounceable} className="btn btn-secondary">
            {t('tools.randomString.pronounceable')}
          </button>
        </div>

        {/* Output */}
        {strings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.randomString.output')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-40 resize-none font-mono text-sm bg-surface"
            />
          </div>
        )}
      </div>
    </div>
  );
}
