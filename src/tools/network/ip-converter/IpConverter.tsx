import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseIPv4, decimalToIPv4, parseIPv6, type IPv4Info, type IPv6Info } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'ipv4' | 'ipv6' | 'decimal';

type Result =
  | { type: 'ipv4'; data: IPv4Info | null }
  | { type: 'ipv6'; data: IPv6Info | null }
  | { type: 'decimal'; data: { ip: string; info: IPv4Info | null } | null };

export default function IpConverter() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('ipv4');
  const [input, setInput] = useState('');

  const result = useMemo((): Result | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (mode === 'ipv4') {
      return { type: 'ipv4', data: parseIPv4(trimmed) };
    } else if (mode === 'ipv6') {
      return { type: 'ipv6', data: parseIPv6(trimmed) };
    } else {
      const ip = decimalToIPv4(trimmed);
      if (!ip) return { type: 'decimal', data: null };
      return { type: 'decimal', data: { ip, info: parseIPv4(ip) } };
    }
  }, [mode, input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.ipConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.ipConverter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => { setMode('ipv4'); setInput(''); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'ipv4' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            IPv4
          </button>
          <button
            onClick={() => { setMode('ipv6'); setInput(''); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'ipv6' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            IPv6
          </button>
          <button
            onClick={() => { setMode('decimal'); setInput(''); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'decimal' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.ipConverter.decimalToIp')}
          </button>
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {mode === 'decimal' ? t('tools.ipConverter.decimalLabel') : t('tools.ipConverter.ipLabel')}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'ipv4' ? '192.168.1.1' :
              mode === 'ipv6' ? '2001:db8::1' :
              '3232235777'
            }
            className="w-full max-w-md font-mono"
          />
        </div>

        {/* Error */}
        {input.trim() && result && !result.data && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10">
            <p className="text-sm text-error">{t('tools.ipConverter.invalidIp')}</p>
          </div>
        )}

        {/* IPv4 Result */}
        {result?.type === 'ipv4' && result.data && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary w-32">{t('tools.ipConverter.decimal')}</td>
                  <td className="px-4 py-2 font-mono">{result.data.decimal}</td>
                  <td className="px-4 py-2 w-12"><CopyButton text={result.data.decimal} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.binary')}</td>
                  <td className="px-4 py-2 font-mono text-xs">{result.data.binary}</td>
                  <td className="px-4 py-2"><CopyButton text={result.data.binary} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.hex')}</td>
                  <td className="px-4 py-2 font-mono">{result.data.hex}</td>
                  <td className="px-4 py-2"><CopyButton text={result.data.hex} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.octal')}</td>
                  <td className="px-4 py-2 font-mono">{result.data.octal}</td>
                  <td className="px-4 py-2"><CopyButton text={result.data.octal} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.class')}</td>
                  <td className="px-4 py-2" colSpan={2}>{result.data.class}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.type')}</td>
                  <td className="px-4 py-2" colSpan={2}>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      result.data.isPrivate ? 'bg-warning/20 text-warning' :
                      result.data.isLoopback ? 'bg-accent/20 text-accent' :
                      result.data.isMulticast ? 'bg-error/20 text-error' :
                      'bg-success/20 text-success'
                    }`}>
                      {result.data.type}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* IPv6 Result */}
        {result?.type === 'ipv6' && result.data && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary w-32">{t('tools.ipConverter.full')}</td>
                  <td className="px-4 py-2 font-mono text-xs break-all">{result.data.full}</td>
                  <td className="px-4 py-2 w-12"><CopyButton text={result.data.full} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.compressed')}</td>
                  <td className="px-4 py-2 font-mono">{result.data.compressed}</td>
                  <td className="px-4 py-2"><CopyButton text={result.data.compressed} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.type')}</td>
                  <td className="px-4 py-2" colSpan={2}>{result.data.type}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Decimal to IP Result */}
        {result?.type === 'decimal' && result.data && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-border bg-surface">
              <span className="text-text-muted text-sm">{t('tools.ipConverter.ipAddress')}:</span>
              <span className="ml-2 font-mono text-lg">{result.data.ip}</span>
              <CopyButton text={result.data.ip} />
            </div>
            {result.data.info && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-2 font-medium text-text-secondary w-32">{t('tools.ipConverter.class')}</td>
                      <td className="px-4 py-2">{result.data.info.class}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.ipConverter.type')}</td>
                      <td className="px-4 py-2">{result.data.info.type}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Common IPs */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.ipConverter.commonIps')}
          </p>
          <div className="flex flex-wrap gap-2">
            {['127.0.0.1', '192.168.1.1', '10.0.0.1', '8.8.8.8', '::1', '2001:db8::1'].map((ip) => (
              <button
                key={ip}
                onClick={() => {
                  setMode(ip.includes(':') ? 'ipv6' : 'ipv4');
                  setInput(ip);
                }}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded font-mono"
              >
                {ip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
