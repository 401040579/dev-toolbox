import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { compressImage, formatFileSize } from './index';

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export default function ImageCompressor() {
  const { t } = useTranslation();
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [original, setOriginal] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const [compressed, setCompressed] = useState<{ url: string; size: number; width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new window.Image();
    img.onload = () => {
      setOriginal({ file, url: URL.createObjectURL(file), width: img.width, height: img.height });
      setCompressed(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleCompress = async () => {
    if (!original) return;
    setProcessing(true);
    try {
      const result = await compressImage(original.file, {
        quality: quality / 100,
        maxWidth,
        maxHeight,
        format,
      });
      setCompressed({
        url: result.dataUrl,
        size: result.blob.size,
        width: result.width,
        height: result.height,
      });
    } catch {
      // Error handling
    }
    setProcessing(false);
  };

  const handleDownload = () => {
    if (!compressed) return;
    const ext = format.split('/')[1] || 'jpg';
    const a = document.createElement('a');
    a.href = compressed.url;
    a.download = `compressed.${ext}`;
    a.click();
  };

  const savings = original && compressed
    ? Math.round((1 - compressed.size / original.file.size) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.imageCompressor.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.imageCompressor.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
        >
          <p className="text-text-secondary text-sm">{t('tools.imageCompressor.dropzone')}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {original && (
          <>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageCompressor.quality')} ({quality}%)
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageCompressor.maxWidth')}
                </label>
                <input
                  type="number"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value) || 1920)}
                  className="w-24"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageCompressor.maxHeight')}
                </label>
                <input
                  type="number"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(parseInt(e.target.value) || 1080)}
                  className="w-24"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageCompressor.format')}
                </label>
                <select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)} className="w-28">
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
            </div>

            <button onClick={handleCompress} disabled={processing} className="btn btn-primary">
              {processing ? t('tools.imageCompressor.processing') : t('tools.imageCompressor.compress')}
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-xs text-text-muted mb-1">{t('tools.imageCompressor.original')}</p>
                <img src={original.url} alt="Original" className="max-h-32 mx-auto rounded" />
                <p className="text-sm mt-2">{original.width}x{original.height}</p>
                <p className="text-sm">{formatFileSize(original.file.size)}</p>
              </div>

              {compressed && (
                <div className="p-3 rounded-lg bg-surface-alt text-center">
                  <p className="text-xs text-text-muted mb-1">{t('tools.imageCompressor.compressed')}</p>
                  <img src={compressed.url} alt="Compressed" className="max-h-32 mx-auto rounded" />
                  <p className="text-sm mt-2">{compressed.width}x{compressed.height}</p>
                  <p className="text-sm">{formatFileSize(compressed.size)}</p>
                  {savings > 0 && <p className="text-sm text-success">-{savings}%</p>}
                </div>
              )}
            </div>

            {compressed && (
              <button onClick={handleDownload} className="btn btn-secondary">
                {t('tools.imageCompressor.download')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
