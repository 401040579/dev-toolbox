import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { crc32, crc16, adler32 } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function Checksum() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const checksums = useMemo(() => {
    if (!input) return null;
    return {
      crc32: crc32(input),
      crc16: crc16(input),
      adler32: adler32(input),
    };
  }, [input]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.checksum.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.checksum.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.checksum.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.checksum.inputPlaceholder')}
            className="w-full h-32 font-mono resize-none"
          />
        </div>

        {/* Results */}
        {checksums && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              {t('tools.checksum.outputLabel')}
            </label>

            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2 font-medium text-text-secondary w-32">CRC32</td>
                    <td className="px-4 py-2 font-mono">{checksums.crc32}</td>
                    <td className="px-4 py-2 w-16">
                      <CopyButton text={checksums.crc32} />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-text-secondary">CRC16</td>
                    <td className="px-4 py-2 font-mono">{checksums.crc16}</td>
                    <td className="px-4 py-2">
                      <CopyButton text={checksums.crc16} />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-text-secondary">Adler-32</td>
                    <td className="px-4 py-2 font-mono">{checksums.adler32}</td>
                    <td className="px-4 py-2">
                      <CopyButton text={checksums.adler32} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
