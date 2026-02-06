import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateBasicAuth, decodeBasicAuth } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function BasicAuth() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [header, setHeader] = useState('');
  const [decoded, setDecoded] = useState<{ username: string; password: string } | null>(null);

  const handleGenerate = () => {
    setHeader(generateBasicAuth(username, password));
  };

  const handleDecode = () => {
    setDecoded(decodeBasicAuth(header));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.basicAuth.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.basicAuth.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => setMode('encode')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'encode' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.basicAuth.encode')}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'decode' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.basicAuth.decode')}
          </button>
        </div>

        {mode === 'encode' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.basicAuth.username')}
                </label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.basicAuth.password')}
                </label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full font-mono" />
              </div>
            </div>

            <button onClick={handleGenerate} className="btn btn-primary">
              {t('tools.basicAuth.generate')}
            </button>

            {header && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                    Authorization Header
                  </label>
                  <CopyButton text={header} />
                </div>
                <input type="text" readOnly value={header} className="w-full font-mono bg-surface" />
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Authorization Header
              </label>
              <input
                type="text"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                placeholder="Basic dXNlcjpwYXNz"
                className="w-full font-mono"
              />
            </div>

            <button onClick={handleDecode} className="btn btn-primary">
              {t('tools.basicAuth.decode')}
            </button>

            {decoded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-surface-alt">
                  <p className="text-xs text-text-muted mb-1">{t('tools.basicAuth.username')}</p>
                  <p className="font-mono text-sm text-text-primary">{decoded.username}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-alt">
                  <p className="text-xs text-text-muted mb-1">{t('tools.basicAuth.password')}</p>
                  <p className="font-mono text-sm text-text-primary">{decoded.password}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
