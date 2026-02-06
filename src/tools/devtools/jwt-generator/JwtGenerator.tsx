import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateJwt, type JwtAlgorithm } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    sub: '1234567890',
    name: 'John Doe',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  null,
  2
);

export default function JwtGenerator() {
  const { t } = useTranslation();
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>('HS256');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    try {
      const parsed = JSON.parse(payload);
      const jwt = await generateJwt(parsed, secret, algorithm);
      setToken(jwt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid payload JSON');
    }
  };

  const addTimestamp = (field: string) => {
    try {
      const parsed = JSON.parse(payload);
      parsed[field] = Math.floor(Date.now() / 1000) + (field === 'exp' ? 3600 : 0);
      setPayload(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.jwtGenerator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.jwtGenerator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.jwtGenerator.algorithm')}
            </label>
            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as JwtAlgorithm)} className="w-32">
              <option value="HS256">HS256</option>
              <option value="HS384">HS384</option>
              <option value="HS512">HS512</option>
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.jwtGenerator.secret')}
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.jwtGenerator.payload')}
            </label>
            <div className="flex gap-2">
              <button onClick={() => addTimestamp('iat')} className="text-xs text-accent hover:underline">+iat</button>
              <button onClick={() => addTimestamp('exp')} className="text-xs text-accent hover:underline">+exp</button>
              <button onClick={() => addTimestamp('nbf')} className="text-xs text-accent hover:underline">+nbf</button>
            </div>
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="w-full h-40 resize-none font-mono text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button onClick={handleGenerate} className="btn btn-primary">
          {t('tools.jwtGenerator.generate')}
        </button>

        {token && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('tools.jwtGenerator.token')}
              </label>
              <CopyButton text={token} />
            </div>
            <textarea
              readOnly
              value={token}
              className="w-full h-24 resize-none font-mono text-xs bg-surface break-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
