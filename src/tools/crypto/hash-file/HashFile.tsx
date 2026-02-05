import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { hashFileMultiple, type HashAlgorithm } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function HashFile() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Record<HashAlgorithm, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError('');
    setHashes(null);
    setProgress(0);

    try {
      const results = await hashFileMultiple(selectedFile, setProgress);
      setHashes(results);
    } catch (e) {
      setError(t('tools.hashFile.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const verifyMatches = (hash: string): boolean | null => {
    if (!verifyHash.trim()) return null;
    return hash.toLowerCase() === verifyHash.toLowerCase().trim();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.hashFile.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.hashFile.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* File Input */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50'
          }`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-text-muted">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm">{t('tools.hashFile.dropzone')}</p>
            </div>
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="p-3 rounded-lg bg-surface-alt">
            <p className="text-sm font-medium text-text-primary">{file.name}</p>
            <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{t('tools.hashFile.calculating')}</span>
              <span className="text-text-muted">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Verify Hash */}
        {hashes && (
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.hashFile.verifyLabel')}
            </label>
            <input
              type="text"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder={t('tools.hashFile.verifyPlaceholder')}
              className="w-full font-mono text-sm"
            />
          </div>
        )}

        {/* Results */}
        {hashes && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {(Object.entries(hashes) as [HashAlgorithm, string][]).map(([algo, hash]) => {
                  const match = verifyMatches(hash);
                  return (
                    <tr key={algo} className={match === true ? 'bg-success/10' : match === false ? '' : ''}>
                      <td className="px-4 py-2 font-medium text-text-secondary w-24">{algo}</td>
                      <td className="px-4 py-2 font-mono text-xs break-all">
                        {hash}
                        {match === true && (
                          <span className="ml-2 text-success">✓ {t('tools.hashFile.match')}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 w-12">
                        <CopyButton text={hash} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
