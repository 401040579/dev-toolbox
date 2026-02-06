import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { extractColors, type ExtractedColor } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function ImageColorExtractor() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [maxColors, setMaxColors] = useState(8);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setColors([]);
  };

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const result = await extractColors(file, maxColors);
      setColors(result);
    } catch {
      // Error handling
    }
    setProcessing(false);
  };

  const allHexes = colors.map((c) => c.hex).join(', ');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.imageColorExtractor.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.imageColorExtractor.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
        >
          <p className="text-text-secondary text-sm">{t('tools.imageColorExtractor.dropzone')}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {file && (
          <>
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="Source" className="max-h-48 rounded-lg border border-border" />
              </div>
            )}

            <div className="flex items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {t('tools.imageColorExtractor.maxColors')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxColors}
                  onChange={(e) => setMaxColors(parseInt(e.target.value) || 8)}
                  className="w-20"
                />
              </div>
              <button onClick={handleExtract} disabled={processing} className="btn btn-primary">
                {processing ? t('tools.imageColorExtractor.processing') : t('tools.imageColorExtractor.extract')}
              </button>
            </div>

            {colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    {t('tools.imageColorExtractor.extractedColors')}
                  </label>
                  <CopyButton text={allHexes} />
                </div>

                <div className="flex h-12 rounded-lg overflow-hidden border border-border">
                  {colors.map((c) => (
                    <div
                      key={c.hex}
                      style={{ backgroundColor: c.hex, flex: c.percentage }}
                      title={`${c.hex} (${c.percentage}%)`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colors.map((c) => (
                    <div key={c.hex} className="flex items-center gap-2 p-2 rounded bg-surface-alt">
                      <div
                        className="w-8 h-8 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono text-text-primary">{c.hex}</code>
                          <CopyButton text={c.hex} />
                        </div>
                        <p className="text-xs text-text-muted">{c.percentage}%</p>
                      </div>
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
