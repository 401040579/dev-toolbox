import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateIBAN, validateIBAN, formatIBAN, parseIBAN, getSupportedCountries } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function IbanGenerator() {
  const { t } = useTranslation();
  const [country, setCountry] = useState('DE');
  const [count, setCount] = useState(5);
  const [ibans, setIbans] = useState<string[]>([]);
  const [validateInput, setValidateInput] = useState('');

  const countries = getSupportedCountries();

  const handleGenerate = () => {
    const generated: string[] = [];
    for (let i = 0; i < count; i++) {
      generated.push(formatIBAN(generateIBAN(country)));
    }
    setIbans(generated);
  };

  const validation = validateInput ? validateIBAN(validateInput) : null;
  const parsed = validateInput ? parseIBAN(validateInput) : null;

  const output = ibans.join('\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.iban.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.iban.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Generator Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-primary">{t('tools.iban.generateTitle')}</h2>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.iban.countryLabel')}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-48"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.iban.countLabel')}
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

          <button onClick={handleGenerate} className="btn btn-primary">
            {t('tools.iban.generate')}
          </button>

          {ibans.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                  {t('tools.iban.output')}
                </label>
                <CopyButton text={output} />
              </div>
              <textarea
                readOnly
                value={output}
                className="w-full h-32 resize-none font-mono text-sm bg-surface"
              />
            </div>
          )}
        </div>

        {/* Validator Section */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-text-primary">{t('tools.iban.validateTitle')}</h2>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.iban.validateInput')}
            </label>
            <input
              type="text"
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
              className="w-full font-mono"
            />
          </div>

          {validation && (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${validation.valid ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {validation.message}
              </div>

              {parsed && validation.valid && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-surface-alt">
                    <p className="text-xs text-text-muted mb-1">{t('tools.iban.country')}</p>
                    <p className="font-mono text-sm">{parsed.countryCode}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-alt">
                    <p className="text-xs text-text-muted mb-1">{t('tools.iban.checkDigits')}</p>
                    <p className="font-mono text-sm">{parsed.checkDigits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-alt">
                    <p className="text-xs text-text-muted mb-1">{t('tools.iban.bban')}</p>
                    <p className="font-mono text-sm text-ellipsis overflow-hidden">{parsed.bban}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="p-4 rounded-lg bg-warning/10 text-sm text-warning">
          {t('tools.iban.warning')}
        </div>
      </div>
    </div>
  );
}
