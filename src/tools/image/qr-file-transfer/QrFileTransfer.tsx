import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDraftState } from '@/hooks/useDraftState';
import { consumeQrFile, peekQrFile } from './file-handoff';
import { MAX_BATCH_BYTES, MAX_FILE_BYTES, MAX_FILES, validateBatch, TransferError, type FileMetadata, type TransferErrorCode } from './protocol';
import type { ReceiveProgress } from './engine';
import raptorWasmUrl from '@raptorqr/raptorq-wasm/wasm/raptorqr_raptorq_wasm_bg.wasm?url';
import readerWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

const speeds = { compatible: 3, standard: 6, fast: 10 } as const;
type Speed = keyof typeof speeds;
function createWorker(): Worker { return new Worker(new URL('../../../workers/qr-transfer.worker.ts', import.meta.url), { type: 'module' }); }
function errorKey(error: unknown): string {
  return error instanceof TransferError ? `tools.qrTransfer.errors.${error.code}` : 'tools.qrTransfer.errors.engine';
}

function OfflineStatus() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    if ('serviceWorker' in navigator && 'caches' in window) {
      navigator.serviceWorker.ready.then(async () => {
        const results = await Promise.all([raptorWasmUrl, readerWasmUrl].map((url) => caches.match(new URL(url, location.href))));
        if (active) setReady(results.every(Boolean));
      }).catch(() => {});
    }
    return () => { active = false; };
  }, []);
  return <p className="text-xs text-text-muted">{ready ? t('tools.qrTransfer.offlineReady') : t('tools.qrTransfer.offlinePreparing')}</p>;
}

function SendPanel() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>(() => { const file = peekQrFile(); return file ? [file] : []; });
  const [speed, setSpeed] = useDraftState<Speed>('qrSpeed', 'standard', { allowed: ['compatible', 'standard', 'fast'] });
  const [size, setSize] = useDraftState('qrSize', 512, { allowed: [384, 512, 768] });
  const [status, setStatus] = useState<'idle' | 'preparing' | 'playing' | 'paused'>('idle');
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState({ file: 0, index: 0, pass: 1 });
  const [fullscreen, setFullscreen] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worker = useRef<Worker | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const running = useRef(false);
  const rate = useRef(speeds[speed]);
  const frames = useRef<number[]>([]);
  const position = useRef({ file: 0, index: 0, pass: 1 });
  const matrix = useRef<{ modules: Uint8Array; size: number } | undefined>(undefined);
  const requested = useRef(false);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, value = matrix.current;
    if (!canvas || !value) return;
    const scale = Math.max(3, Math.floor(size / (value.size + 8)));
    canvas.width = canvas.height = (value.size + 8) * scale;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000';
    for (let y = 0; y < value.size; y++) for (let x = 0; x < value.size; x++) {
      if (value.modules[y * value.size + x]) context.fillRect((x + 4) * scale, (y + 4) * scale, scale, scale);
    }
  }, [size]);
  const drawRef = useRef(draw);
  useEffect(() => { drawRef.current = draw; draw(); }, [draw]);
  useEffect(() => { rate.current = speeds[speed]; }, [speed]);
  const stop = useCallback(() => {
    running.current = false; requested.current = false; clearTimeout(timer.current); clearTimeout(deadline.current);
    worker.current?.terminate(); worker.current = undefined;
  }, []);
  useEffect(() => { consumeQrFile(); return stop; }, [stop]);
  const requestFrame = useCallback(() => {
    if (!running.current || requested.current || !worker.current) return;
    requested.current = true;
    deadline.current = setTimeout(() => { stop(); setStatus('idle'); setError('tools.qrTransfer.errors.engine'); }, 15_000);
    worker.current.postMessage({ type: 'frame', ...position.current });
  }, [stop]);
  const chooseFiles = (selected: File[]) => {
    stop(); setStatus('idle'); setError(''); matrix.current = undefined;
    try { validateBatch(selected); setFiles(selected); }
    catch (failure) { setFiles([]); setError(errorKey(failure)); }
  };
  const start = () => {
    stop(); setError('');
    try { validateBatch(files); } catch (failure) { setError(errorKey(failure)); return; }
    setStatus('preparing'); position.current = { file: 0, index: 0, pass: 1 }; setCursor(position.current);
    const current = createWorker(); worker.current = current;
    const fail = (key: string) => { if (worker.current !== current) return; stop(); setStatus('idle'); setError(key); };
    deadline.current = setTimeout(() => fail('tools.qrTransfer.errors.engine'), 60_000);
    current.onerror = () => fail('tools.qrTransfer.errors.engine');
    current.onmessage = (event) => {
      if (worker.current !== current) return;
      const message = event.data;
      if (message.type === 'error') { fail(`tools.qrTransfer.errors.${message.code as TransferErrorCode}`); return; }
      if (message.type === 'prepared') {
        clearTimeout(deadline.current);
        frames.current = message.files.map((file: { frames: number }) => file.frames);
        running.current = true; setStatus('playing'); requestFrame();
      } else if (message.type === 'frame') {
        clearTimeout(deadline.current); requested.current = false;
        if (!running.current) return;
        matrix.current = message; drawRef.current(); setCursor({ ...position.current });
        const next = { ...position.current, index: position.current.index + 1 };
        if (next.index >= frames.current[next.file]!) { next.index = 0; next.file++; }
        if (next.file >= frames.current.length) { next.file = 0; next.pass++; }
        position.current = next;
        timer.current = setTimeout(requestFrame, 1000 / rate.current);
      }
    };
    current.postMessage({ type: 'prepare', files });
  };
  const togglePause = () => {
    if (status === 'playing') { running.current = false; clearTimeout(timer.current); setStatus('paused'); }
    else { running.current = true; setStatus('playing'); requestFrame(); }
  };
  const exitFullscreen = useCallback(() => {
    setFullscreen(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') exitFullscreen(); };
    const change = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener('keydown', key); document.addEventListener('fullscreenchange', change);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', change); };
  }, [exitFullscreen]);
  const expand = () => { setFullscreen(true); void paneRef.current?.requestFullscreen?.().catch(() => {}); };

  return <div className="space-y-5">
    <label className="block rounded-lg border-2 border-dashed border-border p-5 cursor-pointer hover:border-accent">
      <span className="font-medium">{t('tools.qrTransfer.choose')}</span>
      <input aria-label={t('tools.qrTransfer.choose')} type="file" multiple className="block mt-3 max-w-full text-sm" onChange={(event) => { chooseFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      <span className="block text-xs text-text-muted mt-2">{t('tools.qrTransfer.limits', { file: formatFileSize(MAX_FILE_BYTES), total: formatFileSize(MAX_BATCH_BYTES), count: MAX_FILES })}</span>
    </label>
    {!!files.length && <ol className="text-sm space-y-2" aria-label={t('tools.qrTransfer.queue')}>
      {files.map((file, index) => <li key={index} className="flex items-center gap-3"><span className="min-w-0 flex-1 break-all">{index + 1}. {file.name}</span><span className="shrink-0 text-text-muted">{formatFileSize(file.size)}</span><button className="btn btn-secondary" disabled={status === 'preparing' || status === 'playing' || status === 'paused'} aria-label={t('tools.qrTransfer.remove', { name: file.name })} onClick={() => chooseFiles(files.filter((_, i) => i !== index))}>×</button></li>)}
    </ol>}
    <div className="flex flex-wrap items-end gap-4">
      <label className="text-sm">{t('tools.qrTransfer.speed')}<select aria-label={t('tools.qrTransfer.speed')} className="block mt-1" value={speed} onChange={(event) => setSpeed(event.target.value as Speed)}>
        <option value="compatible">{t('tools.qrTransfer.compatible')} · 3 FPS</option><option value="standard">{t('tools.qrTransfer.standard')} · 6 FPS</option><option value="fast">{t('tools.qrTransfer.fast')} · 10 FPS</option>
      </select></label>
      <label className="text-sm">{t('tools.qrTransfer.size')}<select aria-label={t('tools.qrTransfer.size')} className="block mt-1" value={size} onChange={(event) => setSize(Number(event.target.value))}>{[384, 512, 768].map((value) => <option key={value} value={value}>{value}px</option>)}</select></label>
      <button className="btn btn-primary" onClick={start} disabled={!files.length || status !== 'idle'}>{status === 'preparing' ? t('tools.qrTransfer.preparing') : t('tools.qrTransfer.startSend')}</button>
      {status !== 'idle' && <button className="btn btn-secondary" onClick={() => { stop(); setStatus('idle'); }}>{t('tools.qrTransfer.stopSend')}</button>}
    </div>
    {error && <p role="alert" className="text-error text-sm">{t(error)}</p>}
    {status !== 'idle' && <div ref={paneRef} className={fullscreen ? 'fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-4 gap-3 overflow-auto' : 'rounded-xl border border-border bg-surface-alt p-4 flex flex-col items-center gap-3'}>
      <p role="status" className="text-sm text-center break-all">{status === 'preparing' ? t('tools.qrTransfer.preparing') : t('tools.qrTransfer.playback', { name: files[cursor.file]?.name, frame: cursor.index + 1, total: frames.current[cursor.file], pass: cursor.pass })}</p>
      <canvas ref={canvasRef} role="img" aria-label={t('tools.qrTransfer.qrAlt')} className="max-w-full bg-white" style={{ imageRendering: 'pixelated', maxHeight: fullscreen ? '70vh' : undefined, objectFit: 'contain' }} />
      <div className="flex gap-3">{status !== 'preparing' && <button className="btn btn-primary" onClick={togglePause}>{status === 'playing' ? t('tools.qrTransfer.pause') : t('tools.qrTransfer.resume')}</button>}<button className="btn btn-secondary" onClick={fullscreen ? exitFullscreen : expand}>{fullscreen ? t('tools.qrTransfer.exitFullscreen') : t('tools.qrTransfer.fullscreen')}</button></div>
    </div>}
    <p className="text-sm text-text-secondary">{t('tools.qrTransfer.sendHelp')}</p>
  </div>;
}

interface ReceivedFile { metadata: FileMetadata; url: string; preview: boolean }
function ReceivePanel() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning'>('idle');
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState('');
  const [progress, setProgress] = useState<ReceiveProgress[]>([]);
  const [completed, setCompleted] = useState<ReceivedFile[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const workerRef = useRef<Worker | undefined>(undefined);
  const running = useRef(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const urls = useRef(new Set<string>());
  const completedIds = useRef(new Set<string>());
  const capture = useRef<() => void>(() => {});
  const captureCanvas = useRef<HTMLCanvasElement | undefined>(undefined);
  const stop = useCallback(() => {
    generation.current++; running.current = false; busy.current = false; clearTimeout(timer.current); clearTimeout(deadline.current);
    streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = undefined;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  useEffect(() => () => { stop(); workerRef.current?.terminate(); workerRef.current = undefined; urls.current.forEach((url) => URL.revokeObjectURL(url)); }, [stop]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) { stop(); setStatus('idle'); } };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [stop]);
  const fail = (key: string, fatal = false) => {
    stop(); setStatus('idle'); setError(key);
    if (fatal) { workerRef.current?.terminate(); workerRef.current = undefined; setProgress([]); }
  };
  capture.current = () => {
    if (!running.current || busy.current || !workerRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) { timer.current = setTimeout(() => capture.current(), 100); return; }
    try {
      const canvas = captureCanvas.current ??= document.createElement('canvas');
      const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('canvas');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      busy.current = true;
      workerRef.current.postMessage({ type: 'scan', generation: generation.current, rgba: pixels.data, width: canvas.width, height: canvas.height }, [pixels.data.buffer]);
      deadline.current = setTimeout(() => fail('tools.qrTransfer.errors.engine', true), 15_000);
    } catch { fail('tools.qrTransfer.errors.engine', true); }
  };
  const start = async () => {
    stop(); const token = generation.current; setError(''); setStatus('starting');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { fail('tools.qrTransfer.errors.cameraUnsupported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: device ? { deviceId: { exact: device }, width: { ideal: 1280 }, height: { ideal: 720 } } : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (token !== generation.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', () => { if (token === generation.current) fail('tools.qrTransfer.errors.cameraEnded'); }, { once: true }));
      const video = videoRef.current;
      if (!video) { stop(); return; }
      deadline.current = setTimeout(() => { if (token === generation.current) fail('tools.qrTransfer.errors.cameraBusy'); }, 15_000);
      video.srcObject = stream; await video.play();
      if (token !== generation.current) return;
      clearTimeout(deadline.current);
      void navigator.mediaDevices.enumerateDevices().then((values) => { if (token === generation.current) setDevices(values.filter((item) => item.kind === 'videoinput')); }).catch(() => {});
      if (!workerRef.current) {
        const worker = createWorker(); workerRef.current = worker;
        worker.onerror = () => { if (workerRef.current === worker) fail('tools.qrTransfer.errors.engine', true); };
        worker.onmessage = (event) => {
          if (workerRef.current !== worker) return;
          const message = event.data;
          if (message.type === 'ready') { if (running.current && message.generation === generation.current) { clearTimeout(deadline.current); setStatus('scanning'); capture.current(); } }
          else if (message.type === 'scanned' && message.generation === generation.current) { busy.current = false; clearTimeout(deadline.current); if (running.current) timer.current = setTimeout(() => capture.current(), 50); }
          else if (message.type === 'progress') setProgress((previous) => [...previous.filter((entry) => entry.metadata.id !== message.progress.metadata.id), message.progress]);
          else if (message.type === 'complete') {
            const metadata = message.progress.metadata as FileMetadata;
            if (completedIds.current.has(metadata.id)) return;
            completedIds.current.add(metadata.id);
            // Treat executable and unknown MIME types as downloads only. Never embed HTML/SVG/PDF.
            const preview = /^(image\/(png|jpeg|webp|gif|avif|bmp))$/.test(metadata.mime);
            const blob = new Blob([message.bytes], { type: preview ? metadata.mime : 'application/octet-stream' });
            const url = URL.createObjectURL(blob); urls.current.add(url);
            setCompleted((previous) => [...previous, { metadata, url, preview }]);
            setProgress((previous) => previous.filter((entry) => entry.metadata.id !== metadata.id));
          } else if (message.type === 'error') fail(`tools.qrTransfer.errors.${message.code as TransferErrorCode}`, true);
        };
      }
      running.current = true;
      deadline.current = setTimeout(() => fail('tools.qrTransfer.errors.engine', true), 15_000);
      workerRef.current.postMessage({ type: 'initReceiver', generation: token, completed: completed.map((file) => file.metadata) });
    } catch (failure) {
      if (token !== generation.current) return;
      const name = failure instanceof DOMException ? failure.name : '';
      fail(name === 'NotAllowedError' || name === 'SecurityError' ? 'tools.qrTransfer.errors.cameraDenied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'tools.qrTransfer.errors.cameraMissing' : 'tools.qrTransfer.errors.cameraBusy');
    }
  };
  const clear = () => {
    stop(); workerRef.current?.terminate(); workerRef.current = undefined;
    urls.current.forEach((url) => URL.revokeObjectURL(url)); urls.current.clear(); completedIds.current.clear();
    setCompleted([]); setProgress([]); setError(''); setStatus('idle');
  };
  return <div className="space-y-5">
    <p className="text-sm text-text-secondary">{t('tools.qrTransfer.receiveHelp')}</p>
    <div className="flex flex-wrap items-end gap-3">
      {!!devices.length && <label className="text-sm">{t('tools.qrTransfer.camera')}<select aria-label={t('tools.qrTransfer.camera')} className="block mt-1 max-w-[250px]" value={device} disabled={status !== 'idle'} onChange={(event) => setDevice(event.target.value)}><option value="">{t('tools.qrTransfer.rearCamera')}</option>{devices.map((item, index) => <option key={item.deviceId} value={item.deviceId}>{item.label || t('tools.qrTransfer.cameraNumber', { number: index + 1 })}</option>)}</select></label>}
      <button className="btn btn-primary" onClick={() => void start()} disabled={status !== 'idle'}>{status === 'starting' ? t('tools.qrTransfer.cameraStarting') : t('tools.qrTransfer.startReceive')}</button>
      {status !== 'idle' && <button className="btn btn-secondary" onClick={() => { stop(); setStatus('idle'); }}>{t('tools.qrTransfer.stopReceive')}</button>}
      <button className="btn btn-secondary" onClick={clear}>{t('tools.qrTransfer.clear')}</button>
    </div>
    {error && <p role="alert" className="text-error text-sm">{t(error)}</p>}
    <video ref={videoRef} autoPlay muted playsInline aria-label={t('tools.qrTransfer.cameraPreview')} className={status === 'idle' ? 'hidden' : 'w-full max-w-2xl rounded-lg bg-black aspect-video object-contain'} />
    {status === 'scanning' && <p role="status" className="text-sm text-accent">{t('tools.qrTransfer.scanning')}</p>}
    <div className="space-y-3" aria-label={t('tools.qrTransfer.receiving')}>
      {progress.map((entry) => <div key={entry.metadata.id} className="rounded-lg border border-border p-4 space-y-2">
        <p className="text-sm font-medium break-all">{entry.metadata.name} · {formatFileSize(entry.metadata.size)}</p>
        <progress className="w-full" max={100} value={Math.min(99, entry.received / entry.expected * 100)} aria-label={t('tools.qrTransfer.receiving')} />
        <p className="text-xs text-text-muted">{t('tools.qrTransfer.progress', { received: entry.received, expected: entry.expected, speed: formatFileSize(entry.uniqueBytes / Math.max(1, entry.elapsedMs / 1000)) })}</p>
      </div>)}
    </div>
    <h2 className="font-medium">{t('tools.qrTransfer.completed', { count: completed.length })}</h2>
    {!!completed.length && <div className="grid gap-4 sm:grid-cols-2">{completed.map((file) => <div key={file.metadata.id} className="rounded-lg border border-border p-4 space-y-3 min-w-0">
      {file.preview && <img src={file.url} alt={file.metadata.name} className="max-h-48 mx-auto rounded object-contain" />}
      <p className="font-medium text-sm break-all">{file.metadata.name}</p><p className="text-xs text-success">{t('tools.qrTransfer.verified')} · {formatFileSize(file.metadata.size)}</p>
      <details className="text-xs text-text-muted"><summary>SHA-256</summary><code className="break-all">{file.metadata.hash}</code></details>
      <a className="btn btn-primary inline-block" href={file.url} download={file.metadata.name}>{t('tools.qrTransfer.save')}</a>
    </div>)}</div>}
    <p className="text-xs text-text-muted">{t('tools.qrTransfer.receiveLimits', { count: MAX_FILES, total: formatFileSize(MAX_BATCH_BYTES) })}</p>
  </div>;
}

export default function QrFileTransfer() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  return <div className="flex flex-col h-full">
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border"><h1 className="text-lg font-semibold">{t('tools.qrTransfer.title')}</h1><p className="text-sm text-text-secondary mt-1">{t('tools.qrTransfer.description')}</p></div>
    <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-5">
      <div className="flex gap-2" role="tablist" aria-label={t('tools.qrTransfer.mode')}><button role="tab" aria-selected={mode === 'send'} className={mode === 'send' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setMode('send')}>{t('tools.qrTransfer.send')}</button><button role="tab" aria-selected={mode === 'receive'} className={mode === 'receive' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setMode('receive')}>{t('tools.qrTransfer.receive')}</button></div>
      <OfflineStatus />
      {mode === 'send' ? <SendPanel /> : <ReceivePanel />}
      <p className="text-xs text-text-muted border-t border-border pt-4">{t('tools.qrTransfer.memoryNotice')}</p>
    </div>
  </div>;
}
