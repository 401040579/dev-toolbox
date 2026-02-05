import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { generateToken, generateHexToken, generateBase64Token } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type TokenType = 'alphanumeric' | 'hex' | 'base64' | 'custom';

const CHARSETS = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alphanumericLower: 'abcdefghijklmnopqrstuvwxyz0123456789',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
};

export default function TokenGenerator() {
  const { t } = useTranslation();
  const [tokenType, setTokenType] = useState<TokenType>('alphanumeric');
  const [length, setLength] = useState(32);
  const [customCharset, setCustomCharset] = useState(CHARSETS.alphanumeric);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState<string[]>([]);

  const generate = useCallback(() => {
    const newTokens: string[] = [];
    for (let i = 0; i < count; i++) {
      let token: string;
      switch (tokenType) {
        case 'hex':
          token = generateHexToken(Math.ceil(length / 2)).slice(0, length);
          break;
        case 'base64':
          token = generateBase64Token(Math.ceil(length * 0.75)).slice(0, length);
          break;
        case 'custom':
          token = generateToken(length, customCharset || CHARSETS.alphanumeric);
          break;
        default:
          token = generateToken(length, CHARSETS.alphanumeric);
      }
      newTokens.push(token);
    }
    setTokens(newTokens);
  }, [tokenType, length, count, customCharset]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.tokenGenerator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.tokenGenerator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Token Type */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.tokenGenerator.typeLabel')}
          </label>
          <select
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value as TokenType)}
            className="w-full max-w-xs"
          >
            <option value="alphanumeric">{t('tools.tokenGenerator.typeAlphanumeric')}</option>
            <option value="hex">{t('tools.tokenGenerator.typeHex')}</option>
            <option value="base64">{t('tools.tokenGenerator.typeBase64')}</option>
            <option value="custom">{t('tools.tokenGenerator.typeCustom')}</option>
          </select>
        </div>

        {/* Custom Charset */}
        {tokenType === 'custom' && (
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.tokenGenerator.charsetLabel')}
            </label>
            <input
              type="text"
              value={customCharset}
              onChange={(e) => setCustomCharset(e.target.value)}
              className="w-full font-mono"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setCustomCharset(CHARSETS.alphanumeric)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded"
              >
                A-Za-z0-9
              </button>
              <button
                onClick={() => setCustomCharset(CHARSETS.alphanumericLower)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded"
              >
                a-z0-9
              </button>
              <button
                onClick={() => setCustomCharset(CHARSETS.digits)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded"
              >
                0-9
              </button>
            </div>
          </div>
        )}

        {/* Length and Count */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.tokenGenerator.lengthLabel')}
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(Math.max(1, Math.min(256, parseInt(e.target.value) || 1)))}
              min={1}
              max={256}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.tokenGenerator.countLabel')}
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              className="w-full"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          {t('tools.tokenGenerator.generate')}
        </button>

        {/* Results */}
        {tokens.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.tokenGenerator.outputLabel')}
              </label>
              <CopyButton text={tokens.join('\n')} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 space-y-2 max-h-64 overflow-auto">
              {tokens.map((token, i) => (
                <div key={i} className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm break-all">{token}</code>
                  <CopyButton text={token} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Sizes */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.tokenGenerator.quickLengths')}
          </p>
          <div className="flex flex-wrap gap-2">
            {[16, 32, 64, 128, 256].map((len) => (
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
        </div>
      </div>
    </div>
  );
}
