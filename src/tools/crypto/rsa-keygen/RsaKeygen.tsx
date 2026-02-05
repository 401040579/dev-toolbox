import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateRSAKeyPair, type KeyFormat, type ModulusLength } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function RsaKeygen() {
  const { t } = useTranslation();
  const [modulusLength, setModulusLength] = useState<ModulusLength>(2048);
  const [format, setFormat] = useState<KeyFormat>('pkcs8');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const keys = await generateRSAKeyPair(modulusLength, format);
      setPublicKey(keys.publicKey);
      setPrivateKey(keys.privateKey);
    } catch (e) {
      setError(t('tools.rsaKeygen.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.rsaKeygen.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.rsaKeygen.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.rsaKeygen.keySizeLabel')}
            </label>
            <select
              value={modulusLength}
              onChange={(e) => setModulusLength(parseInt(e.target.value) as ModulusLength)}
              className="w-32"
            >
              <option value={2048}>2048-bit</option>
              <option value={3072}>3072-bit</option>
              <option value={4096}>4096-bit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.rsaKeygen.formatLabel')}
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as KeyFormat)}
              className="w-32"
            >
              <option value="pkcs8">PEM (PKCS#8)</option>
              <option value="jwk">JWK</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? t('tools.rsaKeygen.generating') : t('tools.rsaKeygen.generate')}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Public Key */}
        {publicKey && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.rsaKeygen.publicKeyLabel')}
              </label>
              <CopyButton text={publicKey} />
            </div>
            <textarea
              readOnly
              value={publicKey}
              className="w-full h-40 font-mono text-xs resize-none bg-surface"
            />
          </div>
        )}

        {/* Private Key */}
        {privateKey && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.rsaKeygen.privateKeyLabel')}
              </label>
              <CopyButton text={privateKey} />
            </div>
            <textarea
              readOnly
              value={privateKey}
              className="w-full h-48 font-mono text-xs resize-none bg-surface"
            />
          </div>
        )}

        {/* Warning */}
        {privateKey && (
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/10">
            <p className="text-sm text-warning">{t('tools.rsaKeygen.warning')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
