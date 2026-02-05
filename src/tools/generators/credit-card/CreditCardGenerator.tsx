import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateCreditCards, validateLuhn, detectCardType, formatCardNumber, CardType } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function CreditCardGenerator() {
  const { t } = useTranslation();
  const [cardType, setCardType] = useState<CardType>('visa');
  const [count, setCount] = useState(5);
  const [formatted, setFormatted] = useState(true);
  const [cards, setCards] = useState<string[]>([]);
  const [validateInput, setValidateInput] = useState('');

  const handleGenerate = () => {
    const generated = generateCreditCards(count, cardType);
    setCards(formatted ? generated.map(formatCardNumber) : generated);
  };

  const isValid = validateInput ? validateLuhn(validateInput) : null;
  const detectedType = validateInput ? detectCardType(validateInput) : null;

  const output = cards.join('\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.creditCard.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.creditCard.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Generator Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-primary">{t('tools.creditCard.generateTitle')}</h2>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.creditCard.typeLabel')}
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as CardType)}
                className="w-40"
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
                <option value="discover">Discover</option>
                <option value="random">{t('tools.creditCard.typeRandom')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.creditCard.countLabel')}
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

            <div className="self-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formatted}
                  onChange={(e) => setFormatted(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-text-secondary">{t('tools.creditCard.formatted')}</span>
              </label>
            </div>
          </div>

          <button onClick={handleGenerate} className="btn btn-primary">
            {t('tools.creditCard.generate')}
          </button>

          {cards.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                  {t('tools.creditCard.output')}
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
          <h2 className="text-sm font-medium text-text-primary">{t('tools.creditCard.validateTitle')}</h2>

          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.creditCard.validateInput')}
            </label>
            <input
              type="text"
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value)}
              placeholder="4532 0123 4567 8901"
              className="w-full font-mono"
            />
          </div>

          {validateInput && (
            <div className="flex gap-4">
              <div className={`p-3 rounded-lg ${isValid ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {isValid ? t('tools.creditCard.valid') : t('tools.creditCard.invalid')}
              </div>
              {detectedType && (
                <div className="p-3 rounded-lg bg-surface-alt">
                  {t('tools.creditCard.detectedType')}: <strong>{detectedType}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="p-4 rounded-lg bg-warning/10 text-sm text-warning">
          {t('tools.creditCard.warning')}
        </div>
      </div>
    </div>
  );
}
