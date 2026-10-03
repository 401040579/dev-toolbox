import { useDraftState } from '@/hooks/useDraftState';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { handoffQrFile } from '../qr-file-transfer/file-handoff';
import { safeFilename, TransferError } from '../qr-file-transfer/protocol';
import { compressImage, formatFileSize } from './index';

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export default function ImageCompressor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const generation = useRef(0);
  const pendingImage = useRef<{ image: HTMLImageElement; url: string } | undefined>(undefined);
  const [error, setError] = useState('');
  const [quality, setQuality] = useDraftState('quality', 80, { min: 1, max: 100 });
  const [maxWidth, setMaxWidth] = useDraftState('maxWidth', 1920, { min: 1, max: 8192 });
  const [maxHeight, setMaxHeight] = useDraftState('maxHeight', 1080, { min: 1, max: 8192 });
  const [format, setFormat] = useDraftState<OutputFormat>('format', 'image/jpeg', { allowed: ["image/jpeg","image/png","image/webp"] });
  const [original, setOriginal] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const [compressed, setCompressed] = useState<{ file: File; url: string; size: number; width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    generation.current++;
    if (pendingImage.current) { pendingImage.current.image.onload = pendingImage.current.image.onerror = null; URL.revokeObjectURL(pendingImage.current.url); pendingImage.current = undefined; }
  }, []);
  useEffect(() => () => { if (original) URL.revokeObjectURL(original.url); }, [original]);
  useEffect(() => () => { if (compressed) URL.revokeObjectURL(compressed.url); }, [compressed]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (pendingImage.current) { pendingImage.current.image.onload = pendingImage.current.image.onerror = null; URL.revokeObjectURL(pendingImage.current.url); }
    const token = ++generation.current;
    setCompressed(null); setOriginal(null); setProcessing(false); setError('');
    const url = URL.createObjectURL(file);
    const img = new window.Image(); pendingImage.current = { image: img, url };
    img.onload = () => {
      pendingImage.current = undefined;
      if (token !== generation.current) { URL.revokeObjectURL(url); return; }
      setOriginal({ file, url, width: img.width, height: img.height });
    };
    img.onerror = () => { pendingImage.current = undefined; URL.revokeObjectURL(url); if (token === generation.current) setError('tools.imageCompressor.error'); };
    img.src = url;
  };

  const handleCompress = async () => {
    if (!original) return;
    const token = generation.current;
    setProcessing(true); setError('');
    try {
      const result = await compressImage(original.file, { quality: quality / 100, maxWidth, maxHeight, format });
      if (token !== generation.current) return;
      const ext = result.blob.type.split('/')[1] || 'png';
      const name = safeFilename(original.file.name.replace(/\.[^.]+$/, '') + '-compressed.' + ext);
      const file = new File([result.blob], name, { type: result.blob.type });
      setCompressed({ file, url: URL.createObjectURL(file), size: file.size, width: result.width, height: result.height });
    } catch { if (token === generation.current) setError('tools.imageCompressor.error'); }
    finally { if (token === generation.current) setProcessing(false); }
  };

  const handleDownload = () => {
    if (!compressed) return;
    const a = document.createElement('a'); a.href = compressed.url; a.download = compressed.file.name; a.click();
  };
  const sendQr = () => {
    if (!compressed) return;
    try { handoffQrFile(compressed.file); navigate('/tools/image/qr-file-transfer'); }
    catch (failure) { setError(failure instanceof TransferError ? `tools.qrTransfer.errors.${failure.code}` : 'tools.imageCompressor.error'); }
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
          <input ref={fileRef} aria-label={t('tools.imageCompressor.dropzone')} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {error && <p role="alert" className="text-error text-sm">{t(error)}</p>}
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
                  min={1} max={8192}
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
                  min={1} max={8192}
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
                <img src={original.url} alt={t('common.originalImage')} className="max-h-32 mx-auto rounded" />
                <p className="text-sm mt-2">{original.width}x{original.height}</p>
                <p className="text-sm">{formatFileSize(original.file.size)}</p>
              </div>

              {compressed && (
                <div className="p-3 rounded-lg bg-surface-alt text-center">
                  <p className="text-xs text-text-muted mb-1">{t('tools.imageCompressor.compressed')}</p>
                  <img src={compressed.url} alt={t('common.compressedImage')} className="max-h-32 mx-auto rounded" />
                  <p className="text-sm mt-2">{compressed.width}x{compressed.height}</p>
                  <p className="text-sm">{formatFileSize(compressed.size)}</p>
                  {savings > 0 && <p className="text-sm text-success">-{savings}%</p>}
                </div>
              )}
            </div>

            {compressed && (
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDownload} className="btn btn-secondary">{t('tools.imageCompressor.download')}</button>
                <button onClick={sendQr} className="btn btn-primary">{t('tools.imageCompressor.sendQr')}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
