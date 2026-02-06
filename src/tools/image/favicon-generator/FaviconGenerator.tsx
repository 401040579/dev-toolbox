import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateFavicon, FAVICON_SIZES, type FaviconSize } from './index';

export default function FaviconGenerator() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<FaviconSize[]>([FAVICON_SIZES[0]!, FAVICON_SIZES[1]!]);
  const [results, setResults] = useState<{ size: FaviconSize; dataUrl: string; blob: Blob }[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResults([]);
  };

  const toggleSize = (size: FaviconSize) => {
    setSelectedSizes((prev) => {
      const exists = prev.find((s) => s.width === size.width);
      if (exists) return prev.filter((s) => s.width !== size.width);
      return [...prev, size];
    });
  };

  const handleGenerate = async () => {
    if (!file || selectedSizes.length === 0) return;
    setProcessing(true);
    try {
      const generated = await Promise.all(
        selectedSizes.map(async (size) => {
          const { blob, dataUrl } = await generateFavicon(file, size);
          return { size, dataUrl, blob };
        })
      );
      setResults(generated.sort((a, b) => a.size.width - b.size.width));
    } catch {
      // Error handling
    }
    setProcessing(false);
  };

  const handleDownload = (result: { size: FaviconSize; dataUrl: string }) => {
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `favicon-${result.size.width}x${result.size.height}.png`;
    a.click();
  };

  const handleDownloadAll = () => {
    results.forEach((r) => handleDownload(r));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.faviconGenerator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.faviconGenerator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
        >
          <p className="text-text-secondary text-sm">{t('tools.faviconGenerator.dropzone')}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {file && (
          <>
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="Source" className="max-h-32 rounded-lg border border-border" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.faviconGenerator.selectSizes')}
              </label>
              <div className="flex flex-wrap gap-2">
                {FAVICON_SIZES.map((size) => {
                  const selected = selectedSizes.some((s) => s.width === size.width);
                  return (
                    <button
                      key={size.width}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        selected
                          ? 'bg-accent-muted text-accent border-accent'
                          : 'border-border text-text-secondary hover:border-accent'
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={processing || selectedSizes.length === 0}
              className="btn btn-primary"
            >
              {processing ? t('tools.faviconGenerator.processing') : t('tools.faviconGenerator.generate')}
            </button>

            {results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {t('tools.faviconGenerator.generated', { count: results.length })}
                  </span>
                  <button onClick={handleDownloadAll} className="btn btn-secondary text-sm">
                    {t('tools.faviconGenerator.downloadAll')}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.map((r) => (
                    <div
                      key={r.size.width}
                      className="p-3 rounded-lg bg-surface-alt text-center cursor-pointer hover:ring-2 ring-accent transition-all"
                      onClick={() => handleDownload(r)}
                    >
                      <div className="flex justify-center mb-2">
                        <img
                          src={r.dataUrl}
                          alt={r.size.label}
                          style={{ width: Math.min(r.size.width, 64), height: Math.min(r.size.height, 64) }}
                          className="rounded border border-border"
                        />
                      </div>
                      <p className="text-xs text-text-muted">{r.size.label}</p>
                      <p className="text-xs text-text-secondary">{(r.blob.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
