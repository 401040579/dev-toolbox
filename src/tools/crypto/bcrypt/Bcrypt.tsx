import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hashPassword, verifyPassword } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'hash' | 'verify';

export default function Bcrypt() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('hash');
  const [password, setPassword] = useState('');
  const [iterations, setIterations] = useState(100000);
  const [hash, setHash] = useState('');
  const [hashToVerify, setHashToVerify] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleHash = async () => {
    if (!password) return;
    setLoading(true);
    setResult(null);
    try {
      const hashed = await hashPassword(password, iterations);
      setHash(hashed);
      setResult({ success: true, message: t('tools.bcrypt.hashSuccess') });
    } catch {
      setResult({ success: false, message: t('tools.bcrypt.hashError') });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!password || !hashToVerify) return;
    setLoading(true);
    setResult(null);
    try {
      const isValid = await verifyPassword(password, hashToVerify);
      setResult({
        success: isValid,
        message: isValid ? t('tools.bcrypt.verifyMatch') : t('tools.bcrypt.verifyNoMatch'),
      });
    } catch {
      setResult({ success: false, message: t('tools.bcrypt.verifyError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.bcrypt.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.bcrypt.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => { setMode('hash'); setResult(null); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'hash'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.bcrypt.modeHash')}
          </button>
          <button
            onClick={() => { setMode('verify'); setResult(null); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'verify'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.bcrypt.modeVerify')}
          </button>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.bcrypt.passwordLabel')}
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('tools.bcrypt.passwordPlaceholder')}
            className="w-full max-w-md font-mono"
          />
        </div>

        {mode === 'hash' && (
          <>
            {/* Iterations */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.bcrypt.iterationsLabel')}
              </label>
              <select
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value))}
                className="w-48"
              >
                <option value={10000}>10,000 (Fast)</option>
                <option value={50000}>50,000</option>
                <option value={100000}>100,000 (Recommended)</option>
                <option value={250000}>250,000</option>
                <option value={500000}>500,000 (Slow)</option>
              </select>
            </div>

            {/* Hash Button */}
            <button
              onClick={handleHash}
              disabled={loading || !password}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? t('tools.bcrypt.hashing') : t('tools.bcrypt.hashButton')}
            </button>

            {/* Hash Output */}
            {hash && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                    {t('tools.bcrypt.hashLabel')}
                  </label>
                  <CopyButton text={hash} />
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface font-mono text-sm break-all">
                  {hash}
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'verify' && (
          <>
            {/* Hash to Verify */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.bcrypt.hashToVerifyLabel')}
              </label>
              <textarea
                value={hashToVerify}
                onChange={(e) => setHashToVerify(e.target.value)}
                placeholder={t('tools.bcrypt.hashToVerifyPlaceholder')}
                className="w-full h-20 font-mono text-sm resize-none"
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || !password || !hashToVerify}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? t('tools.bcrypt.verifying') : t('tools.bcrypt.verifyButton')}
            </button>
          </>
        )}

        {/* Result */}
        {result && (
          <div
            className={`p-3 rounded-lg border ${
              result.success
                ? 'border-success/30 bg-success/10'
                : 'border-error/30 bg-error/10'
            }`}
          >
            <p className={`text-sm ${result.success ? 'text-success' : 'text-error'}`}>
              {result.message}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-surface-alt">
          <p className="text-xs text-text-muted">{t('tools.bcrypt.info')}</p>
        </div>
      </div>
    </div>
  );
}
