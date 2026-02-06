import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { imageToBase64, base64ToBlob, getImageInfo } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function ImageBase64() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [base64Output, setBase64Output] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [info, setInfo] = useState<{ mime: string; size: number } | null>(null);
  const [base64Input, setBase64Input] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await imageToBase64(file);
    setBase64Output(dataUrl);
    setImagePreview(dataUrl);
    const imgInfo = getImageInfo(dataUrl);
    if (imgInfo) setInfo({ mime: imgInfo.mime, size: file.size });
  };

  const handleBase64Decode = () => {
    let input = base64Input.trim();
    if (!input.startsWith('data:')) {
      input = `data:image/png;base64,${input}`;
    }
    const blob = base64ToBlob(input);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setImagePreview(url);
      setInfo({ mime: blob.type, size: blob.size });
    }
  };

  const handleDownload = () => {
    if (!imagePreview) return;
    const a = document.createElement('a');
    a.href = imagePreview;
    a.download = 'image';
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.imageBase64.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.imageBase64.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => setMode('encode')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'encode' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.imageBase64.imageToBase64')}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'decode' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.imageBase64.base64ToImage')}
          </button>
        </div>

        {mode === 'encode' ? (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
            >
              <p className="text-text-secondary text-sm">{t('tools.imageBase64.dropzone')}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {imagePreview && (
              <div className="flex justify-center">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-border" />
              </div>
            )}

            {info && (
              <div className="flex gap-4 text-sm text-text-secondary">
                <span>{t('tools.imageBase64.mimeType')}: {info.mime}</span>
                <span>{t('tools.imageBase64.fileSize')}: {(info.size / 1024).toFixed(1)} KB</span>
              </div>
            )}

            {base64Output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                    {t('tools.imageBase64.base64Output')}
                  </label>
                  <CopyButton text={base64Output} />
                </div>
                <textarea
                  readOnly
                  value={base64Output}
                  className="w-full h-32 resize-none font-mono text-xs bg-surface"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('tools.imageBase64.base64Input')}
              </label>
              <textarea
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder={t('tools.imageBase64.base64Placeholder')}
                className="w-full h-32 resize-none font-mono text-xs"
              />
            </div>

            <button onClick={handleBase64Decode} className="btn btn-primary">
              {t('tools.imageBase64.decode')}
            </button>

            {imagePreview && mode === 'decode' && (
              <>
                <div className="flex justify-center">
                  <img src={imagePreview} alt="Decoded" className="max-h-48 rounded-lg border border-border" />
                </div>
                <button onClick={handleDownload} className="btn btn-secondary">
                  {t('tools.imageBase64.download')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
