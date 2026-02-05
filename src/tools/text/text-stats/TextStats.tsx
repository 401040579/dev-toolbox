import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeText } from './index';

export default function TextStats() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const stats = useMemo(() => analyzeText(input), [input]);

  const mainStats = [
    { key: 'characters', label: t('tools.textStats.characters'), value: stats.characters },
    { key: 'charactersNoSpaces', label: t('tools.textStats.charactersNoSpaces'), value: stats.charactersNoSpaces },
    { key: 'words', label: t('tools.textStats.words'), value: stats.words },
    { key: 'sentences', label: t('tools.textStats.sentences'), value: stats.sentences },
    { key: 'paragraphs', label: t('tools.textStats.paragraphs'), value: stats.paragraphs },
    { key: 'lines', label: t('tools.textStats.lines'), value: stats.lines },
  ];

  const extraStats = [
    { key: 'bytes', label: t('tools.textStats.bytes'), value: `${stats.bytes} B` },
    { key: 'readingTime', label: t('tools.textStats.readingTime'), value: `~${stats.readingTime} min` },
    { key: 'speakingTime', label: t('tools.textStats.speakingTime'), value: `~${stats.speakingTime} min` },
    { key: 'uniqueWords', label: t('tools.textStats.uniqueWords'), value: stats.uniqueWords },
    { key: 'avgWordLength', label: t('tools.textStats.avgWordLength'), value: stats.avgWordLength },
    { key: 'avgSentenceLength', label: t('tools.textStats.avgSentenceLength'), value: stats.avgSentenceLength },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.textStats.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.textStats.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.textStats.inputLabel')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.textStats.inputPlaceholder')}
            className="w-full h-40 resize-none"
          />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {mainStats.map(({ key, label, value }) => (
            <div key={key} className="p-3 rounded-lg bg-surface-alt text-center">
              <p className="text-2xl font-bold text-accent">{value.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Extra Stats */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {extraStats.map(({ key, label, value }) => (
                <tr key={key}>
                  <td className="px-4 py-2 font-medium text-text-secondary">{label}</td>
                  <td className="px-4 py-2 text-right font-mono">{value}</td>
                </tr>
              ))}
              {stats.longestWord && (
                <tr>
                  <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.textStats.longestWord')}</td>
                  <td className="px-4 py-2 text-right font-mono">{stats.longestWord} ({stats.longestWord.length})</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
