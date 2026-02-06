import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { convertImage, getFormatExtension, ImageFormat } from './index';

export default function ImageConverter() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { blob, dataUrl } = await convertImage(file, targetFormat, quality / 100);
      setResult({ url: dataUrl, size: blob.size });
    } catch { /* error */ }
    setProcessing(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = getFormatExtension(targetFormat);
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `converted.${ext}`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.imageConverter.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.imageConverter.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
        >
          <p className="text-text-secondary text-sm">{t('tools.imageConverter.dropzone')}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {file && (
          <>
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="Preview" className="max-h-48 rounded-lg border border-border" />
              </div>
            )}

            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageConverter.sourceFormat')}
                </label>
                <div className="text-sm font-mono bg-surface-alt px-3 py-2 rounded">{file.type || 'unknown'}</div>
              </div>
              <span className="text-text-muted pb-2">→</span>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageConverter.targetFormat')}
                </label>
                <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as ImageFormat)} className="w-28">
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/bmp">BMP</option>
                </select>
              </div>
              {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    {t('tools.imageConverter.quality')} ({quality}%)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
              )}
            </div>

            <button onClick={handleConvert} disabled={processing} className="btn btn-primary">
              {processing ? t('tools.imageConverter.processing') : t('tools.imageConverter.convert')}
            </button>

            {result && (
              <div className="space-y-3">
                <div className="text-sm text-text-secondary">
                  {t('tools.imageConverter.outputSize')}: {(result.size / 1024).toFixed(1)} KB
                </div>
                <button onClick={handleDownload} className="btn btn-secondary">
                  {t('tools.imageConverter.download')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
