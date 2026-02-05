import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { parseDataURL, createDataURL, dataURLToBlob } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'create' | 'parse';

const MIME_TYPES = [
  { value: 'text/plain', label: 'Plain Text' },
  { value: 'text/html', label: 'HTML' },
  { value: 'text/css', label: 'CSS' },
  { value: 'text/javascript', label: 'JavaScript' },
  { value: 'application/json', label: 'JSON' },
  { value: 'application/xml', label: 'XML' },
  { value: 'image/svg+xml', label: 'SVG' },
];

export default function DataUrl() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('create');
  const [content, setContent] = useState('');
  const [mimeType, setMimeType] = useState('text/plain');
  const [useBase64, setUseBase64] = useState(true);
  const [dataUrl, setDataUrl] = useState('');

  const createdUrl = useMemo(() => {
    if (mode !== 'create' || !content) return '';
    try {
      return createDataURL(content, mimeType, useBase64);
    } catch {
      return '';
    }
  }, [mode, content, mimeType, useBase64]);

  const parsedInfo = useMemo(() => {
    if (mode !== 'parse' || !dataUrl.trim()) return null;
    return parseDataURL(dataUrl.trim());
  }, [mode, dataUrl]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDownload = useCallback(() => {
    if (!parsedInfo) return;
    const blob = dataURLToBlob(dataUrl);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file.${parsedInfo.mimeType.split('/')[1] || 'bin'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataUrl, parsedInfo]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.dataUrl.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.dataUrl.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => setMode('create')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'create' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.dataUrl.create')}
          </button>
          <button
            onClick={() => setMode('parse')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'parse' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.dataUrl.parse')}
          </button>
        </div>

        {mode === 'create' && (
          <>
            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.dataUrl.mimeType')}
                </label>
                <select
                  value={mimeType}
                  onChange={(e) => setMimeType(e.target.value)}
                  className="w-48"
                >
                  {MIME_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBase64}
                    onChange={(e) => setUseBase64(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text-secondary">{t('tools.dataUrl.base64Encode')}</span>
                </label>
              </div>
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.dataUrl.contentLabel')}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('tools.dataUrl.contentPlaceholder')}
                className="w-full h-32 font-mono text-sm resize-none"
              />
            </div>

            {/* Result */}
            {createdUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                    {t('tools.dataUrl.outputLabel')} ({formatSize(createdUrl.length)})
                  </label>
                  <CopyButton text={createdUrl} />
                </div>
                <textarea
                  readOnly
                  value={createdUrl}
                  className="w-full h-24 font-mono text-xs resize-none bg-surface"
                />
              </div>
            )}
          </>
        )}

        {mode === 'parse' && (
          <>
            {/* File Upload */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.dataUrl.uploadFile')}
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent/90"
              />
            </div>

            {/* Data URL Input */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.dataUrl.dataUrlLabel')}
              </label>
              <textarea
                value={dataUrl}
                onChange={(e) => setDataUrl(e.target.value)}
                placeholder={t('tools.dataUrl.dataUrlPlaceholder')}
                className="w-full h-32 font-mono text-xs resize-none"
              />
            </div>

            {/* Parse Error */}
            {dataUrl.trim() && !parsedInfo && (
              <div className="p-3 rounded-lg border border-error/30 bg-error/10">
                <p className="text-sm text-error">{t('tools.dataUrl.invalidDataUrl')}</p>
              </div>
            )}

            {/* Parsed Info */}
            {parsedInfo && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2 font-medium text-text-secondary w-32">{t('tools.dataUrl.mimeType')}</td>
                        <td className="px-4 py-2 font-mono">{parsedInfo.mimeType}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.dataUrl.encoding')}</td>
                        <td className="px-4 py-2 font-mono">{parsedInfo.encoding}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.dataUrl.urlSize')}</td>
                        <td className="px-4 py-2">{formatSize(parsedInfo.size)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-text-secondary">{t('tools.dataUrl.decodedSize')}</td>
                        <td className="px-4 py-2">{formatSize(parsedInfo.decodedSize)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  {t('tools.dataUrl.download')}
                </button>

                {/* Preview for images/text */}
                {parsedInfo.mimeType.startsWith('image/') && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      {t('tools.dataUrl.preview')}
                    </label>
                    <img src={dataUrl} alt="Preview" className="max-w-full max-h-64 rounded border border-border" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
