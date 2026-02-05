import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseCIDR } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function Cidr() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return parseCIDR(input.trim());
  }, [input]);

  const fields = [
    { key: 'network', label: t('tools.cidr.network') },
    { key: 'broadcast', label: t('tools.cidr.broadcast') },
    { key: 'firstHost', label: t('tools.cidr.firstHost') },
    { key: 'lastHost', label: t('tools.cidr.lastHost') },
    { key: 'netmask', label: t('tools.cidr.netmask') },
    { key: 'wildcardMask', label: t('tools.cidr.wildcardMask') },
    { key: 'binaryNetmask', label: t('tools.cidr.binaryNetmask') },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.cidr.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.cidr.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.cidr.inputLabel')}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.cidr.inputPlaceholder')}
            className="w-full max-w-md font-mono"
          />
        </div>

        {/* Error */}
        {input.trim() && !result && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10">
            <p className="text-sm text-error">{t('tools.cidr.invalidCidr')}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted">{t('tools.cidr.totalHosts')}</p>
                <p className="text-lg font-semibold">{result.totalHosts.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted">{t('tools.cidr.usableHosts')}</p>
                <p className="text-lg font-semibold">{result.usableHosts.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted">{t('tools.cidr.ipClass')}</p>
                <p className="text-lg font-semibold">{result.ipClass}</p>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {fields.map(({ key, label }) => (
                    <tr key={key}>
                      <td className="px-4 py-2 font-medium text-text-secondary w-40">{label}</td>
                      <td className="px-4 py-2 font-mono">{result[key]}</td>
                      <td className="px-4 py-2 w-12">
                        <CopyButton text={result[key]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Common Subnets */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.cidr.commonSubnets')}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              '192.168.1.0/24',
              '10.0.0.0/8',
              '172.16.0.0/12',
              '192.168.0.0/16',
              '10.0.0.0/24',
              '192.168.1.0/28',
            ].map((cidr) => (
              <button
                key={cidr}
                onClick={() => setInput(cidr)}
                className="px-2 py-1 text-xs bg-surface-alt hover:bg-border rounded font-mono"
              >
                {cidr}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.cidr.quickReference')}
          </p>
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="px-3 py-1.5 text-left text-text-muted">CIDR</th>
                  <th className="px-3 py-1.5 text-left text-text-muted">Netmask</th>
                  <th className="px-3 py-1.5 text-left text-text-muted">Hosts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { cidr: '/8', mask: '255.0.0.0', hosts: '16,777,214' },
                  { cidr: '/16', mask: '255.255.0.0', hosts: '65,534' },
                  { cidr: '/24', mask: '255.255.255.0', hosts: '254' },
                  { cidr: '/28', mask: '255.255.255.240', hosts: '14' },
                  { cidr: '/30', mask: '255.255.255.252', hosts: '2' },
                  { cidr: '/32', mask: '255.255.255.255', hosts: '1' },
                ].map((row) => (
                  <tr key={row.cidr}>
                    <td className="px-3 py-1 font-mono">{row.cidr}</td>
                    <td className="px-3 py-1 font-mono">{row.mask}</td>
                    <td className="px-3 py-1">{row.hosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
