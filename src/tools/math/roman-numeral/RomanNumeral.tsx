import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toRoman, fromRoman } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function RomanNumeral() {
  const { t } = useTranslation();
  const [arabic, setArabic] = useState('');
  const [roman, setRoman] = useState('');

  const handleArabicChange = (value: string) => {
    setArabic(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= 3999) {
      setRoman(toRoman(num));
    } else {
      setRoman('');
    }
  };

  const handleRomanChange = (value: string) => {
    setRoman(value.toUpperCase());
    const num = fromRoman(value);
    if (num > 0) {
      setArabic(String(num));
    } else {
      setArabic('');
    }
  };

  // Quick reference table
  const reference = [
    { arabic: 1, roman: 'I' }, { arabic: 4, roman: 'IV' },
    { arabic: 5, roman: 'V' }, { arabic: 9, roman: 'IX' },
    { arabic: 10, roman: 'X' }, { arabic: 40, roman: 'XL' },
    { arabic: 50, roman: 'L' }, { arabic: 90, roman: 'XC' },
    { arabic: 100, roman: 'C' }, { arabic: 400, roman: 'CD' },
    { arabic: 500, roman: 'D' }, { arabic: 900, roman: 'CM' },
    { arabic: 1000, roman: 'M' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.romanNumeral.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.romanNumeral.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.romanNumeral.arabic')}
              </label>
              {arabic && <CopyButton text={arabic} />}
            </div>
            <input
              type="number"
              value={arabic}
              onChange={(e) => handleArabicChange(e.target.value)}
              placeholder="1-3999"
              min={1}
              max={3999}
              className="w-full font-mono text-lg"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.romanNumeral.roman')}
              </label>
              {roman && <CopyButton text={roman} />}
            </div>
            <input
              type="text"
              value={roman}
              onChange={(e) => handleRomanChange(e.target.value)}
              placeholder="e.g. XLII"
              className="w-full font-mono text-lg uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.romanNumeral.reference')}
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {reference.map((r) => (
              <div
                key={r.arabic}
                className="p-2 rounded bg-surface-alt text-center cursor-pointer hover:ring-1 ring-accent"
                onClick={() => handleArabicChange(String(r.arabic))}
              >
                <p className="text-sm font-bold text-accent font-mono">{r.roman}</p>
                <p className="text-xs text-text-muted">{r.arabic}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
