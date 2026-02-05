import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { aesEncrypt, aesDecrypt, type AesMode, type KeySize } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Operation = 'encrypt' | 'decrypt';

export default function Aes() {
  const { t } = useTranslation();
  const [operation, setOperation] = useState<Operation>('encrypt');
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AesMode>('GCM');
  const [keySize, setKeySize] = useState<KeySize>(256);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!input.trim() || !password) {
      setError(t('tools.aes.errorEmpty'));
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      if (operation === 'encrypt') {
        const result = await aesEncrypt(input, password, mode, keySize);
        setOutput(result);
      } else {
        const result = await aesDecrypt(input, password, mode, keySize);
        setOutput(result);
      }
    } catch (e) {
      setError(operation === 'decrypt'
        ? t('tools.aes.errorDecrypt')
        : t('tools.aes.errorEncrypt'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.aes.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.aes.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Operation Toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => { setOperation('encrypt'); setOutput(''); setError(''); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              operation === 'encrypt'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.aes.encrypt')}
          </button>
          <button
            onClick={() => { setOperation('decrypt'); setOutput(''); setError(''); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              operation === 'decrypt'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.aes.decrypt')}
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.aes.modeLabel')}
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AesMode)}
              className="w-32"
            >
              <option value="GCM">GCM</option>
              <option value="CBC">CBC</option>
              <option value="CTR">CTR</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.aes.keySizeLabel')}
            </label>
            <select
              value={keySize}
              onChange={(e) => setKeySize(parseInt(e.target.value) as KeySize)}
              className="w-32"
            >
              <option value={128}>128-bit</option>
              <option value={192}>192-bit</option>
              <option value={256}>256-bit</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.aes.passwordLabel')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('tools.aes.passwordPlaceholder')}
            className="w-full max-w-md"
          />
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {operation === 'encrypt' ? t('tools.aes.plaintextLabel') : t('tools.aes.ciphertextLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={operation === 'encrypt'
              ? t('tools.aes.plaintextPlaceholder')
              : t('tools.aes.ciphertextPlaceholder')}
            className="w-full h-32 font-mono resize-none"
          />
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={loading || !input.trim() || !password}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? t('tools.aes.processing') : (operation === 'encrypt' ? t('tools.aes.encrypt') : t('tools.aes.decrypt'))}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {operation === 'encrypt' ? t('tools.aes.ciphertextLabel') : t('tools.aes.plaintextLabel')}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-32 font-mono resize-none bg-surface"
            />
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-surface-alt">
          <p className="text-xs text-text-muted">
            {t('tools.aes.info')}
          </p>
        </div>
      </div>
    </div>
  );
}
