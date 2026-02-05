import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type Mode = 'charToCode' | 'codeToChar';
type Tab = 'converter' | 'table';

export default function AsciiTable() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('converter');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('charToCode');

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      if (mode === 'charToCode') {
        const chars = Array.from(input);
        return chars.map((char) => ({
          char,
          dec: char.charCodeAt(0),
          hex: char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase(),
          bin: char.charCodeAt(0).toString(2).padStart(8, '0'),
          oct: char.charCodeAt(0).toString(8),
        }));
      } else {
        const codes = input.trim().split(/[\s,]+/).filter(Boolean);
        return codes.map((code) => {
          const num = parseInt(code, 10);
          if (isNaN(num)) throw new Error('Invalid code');
          return {
            char: String.fromCharCode(num),
            dec: num,
            hex: num.toString(16).padStart(2, '0').toUpperCase(),
            bin: num.toString(2).padStart(8, '0'),
            oct: num.toString(8),
          };
        });
      }
    } catch {
      return { error: t('tools.asciiTable.error') };
    }
  }, [input, mode, t]);

  // Generate ASCII table data
  const asciiTableData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 128; i++) {
      let displayChar = '';
      if (i < 32) {
        const controlNames = [
          'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
          'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
          'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
          'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
        ];
        displayChar = controlNames[i] ?? '';
      } else if (i === 32) {
        displayChar = 'SPC';
      } else if (i === 127) {
        displayChar = 'DEL';
      } else {
        displayChar = String.fromCharCode(i);
      }
      data.push({
        dec: i,
        hex: i.toString(16).padStart(2, '0').toUpperCase(),
        char: displayChar,
      });
    }
    return data;
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.asciiTable.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.asciiTable.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'converter'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.asciiTable.tabConverter')}
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'table'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.asciiTable.tabTable')}
          </button>
        </div>

        {activeTab === 'converter' && (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
              <button
                onClick={() => setMode('charToCode')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'charToCode'
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t('tools.asciiTable.charToCode')}
              </button>
              <button
                onClick={() => setMode('codeToChar')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'codeToChar'
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t('tools.asciiTable.codeToChar')}
              </button>
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {mode === 'charToCode'
                  ? t('tools.asciiTable.charLabel')
                  : t('tools.asciiTable.codeLabel')}
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'charToCode'
                    ? t('tools.asciiTable.charPlaceholder')
                    : t('tools.asciiTable.codePlaceholder')
                }
                className="w-full max-w-lg font-mono"
              />
            </div>

            {/* Result */}
            {result && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                {'error' in result ? (
                  <p className="text-error text-sm p-4">{result.error}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-surface-alt">
                      <tr>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Char</th>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Dec</th>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Hex</th>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Binary</th>
                        <th className="text-left px-4 py-2 text-text-muted font-medium">Oct</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-mono">{item.char}</td>
                          <td className="px-4 py-2 font-mono">{item.dec}</td>
                          <td className="px-4 py-2 font-mono">0x{item.hex}</td>
                          <td className="px-4 py-2 font-mono">{item.bin}</td>
                          <td className="px-4 py-2 font-mono">0o{item.oct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'table' && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-alt sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Dec</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Hex</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Char</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium border-l border-border">Dec</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Hex</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Char</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium border-l border-border">Dec</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Hex</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Char</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium border-l border-border">Dec</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Hex</th>
                    <th className="px-2 py-1.5 text-text-muted font-medium">Char</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.from({ length: 32 }, (_, row) => (
                    <tr key={row} className="hover:bg-surface-alt">
                      {[0, 32, 64, 96].map((offset, colIndex) => {
                        const item = asciiTableData[row + offset];
                        if (!item) return null;
                        return (
                          <React.Fragment key={offset}>
                            <td className={`px-2 py-1 font-mono text-center ${colIndex > 0 ? 'border-l border-border' : ''}`}>
                              {item.dec}
                            </td>
                            <td className="px-2 py-1 font-mono text-center text-text-muted">
                              {item.hex}
                            </td>
                            <td className="px-2 py-1 font-mono text-center">
                              {item.char}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
