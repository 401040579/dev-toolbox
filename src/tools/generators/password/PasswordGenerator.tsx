import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from '@/components/copy-button/CopyButton';
import { RefreshCw } from 'lucide-react';

const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePassword(length: number, options: Record<string, boolean>): string {
  let chars = '';
  if (options['lowercase']) chars += CHARSETS.lowercase;
  if (options['uppercase']) chars += CHARSETS.uppercase;
  if (options['numbers']) chars += CHARSETS.numbers;
  if (options['symbols']) chars += CHARSETS.symbols;
  if (!chars) chars = CHARSETS.lowercase + CHARSETS.uppercase + CHARSETS.numbers;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('');
}

function calcStrength(password: string): { labelKey: string; color: string; percent: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { labelKey: 'weak', color: 'text-error', percent: 25 };
  if (score <= 4) return { labelKey: 'fair', color: 'text-warning', percent: 50 };
  if (score <= 5) return { labelKey: 'strong', color: 'text-info', percent: 75 };
  return { labelKey: 'veryStrong', color: 'text-success', percent: 100 };
}

export default function PasswordGenerator() {
  const { t } = useTranslation();
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
  });
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>(() => [
    generatePassword(16, { lowercase: true, uppercase: true, numbers: true, symbols: true }),
  ]);

  const generate = useCallback(() => {
    setPasswords(Array.from({ length: count }, () => generatePassword(length, options)));
  }, [length, options, count]);

  const strength = passwords[0] ? calcStrength(passwords[0]) : null;

  const optionLabels: Record<string, string> = {
    lowercase: t('tools.password.lowercase'),
    uppercase: t('tools.password.uppercase'),
    numbers: t('tools.password.numbers'),
    symbols: t('tools.password.symbols'),
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.password.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.password.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-text-muted w-16">{t('tools.password.length')}</label>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Math.max(4, Math.min(64, Number(e.target.value))))}
              className="w-16 text-center"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-text-muted w-16">{t('tools.password.count')}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-16 text-center"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            {(Object.keys(CHARSETS) as Array<keyof typeof CHARSETS>).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key] ?? false}
                  onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))}
                  className="rounded"
                />
                {optionLabels[key]}
              </label>
            ))}
          </div>

          <button
            onClick={generate}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <RefreshCw size={14} />
            {t('tools.password.generate')}
          </button>
        </div>

        {/* Strength indicator */}
        {strength && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-current transition-all"
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${strength.color}`}>{t(`tools.password.strength.${strength.labelKey}`)}</span>
          </div>
        )}

        {/* Output */}
        <div className="space-y-2">
          {passwords.map((pw, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3">
              <code className="flex-1 font-mono text-sm text-text-primary select-all break-all">{pw}</code>
              <CopyButton text={pw} size={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
