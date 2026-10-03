import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

interface CameraHarness { canvas: HTMLCanvasElement; streams: MediaStream[]; calls: number; permission: 'allow' | 'deny' | 'pending'; resolve?: (stream: MediaStream) => void }
type CameraWindow = Window & { qrCamera: CameraHarness };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=', 'base64');
const binary = Buffer.from(Uint8Array.from({ length: 4100 }, (_, i) => i % 256));

async function fakeCamera(context: BrowserContext, permission: CameraHarness['permission'] = 'allow', senderStream = false) {
  await context.addInitScript(({ value, senderStream }) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 640;
    const harness: CameraHarness = { canvas, streams: [], calls: 0, permission: value };
    (window as CameraWindow).qrCamera = harness;
    if (!navigator.mediaDevices) return;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      harness.calls++;
      if (harness.permission === 'deny') throw new DOMException('Denied', 'NotAllowedError');
      const source = senderStream ? window.opener?.document.querySelector('main canvas') as HTMLCanvasElement : canvas;
      if (!source) throw new Error('Missing sender canvas');
      const stream = source.captureStream(senderStream ? 60 : 30); harness.streams.push(stream);
      const context = canvas.getContext('2d')!; context.fillStyle = '#fff'; context.fillRect(0, 0, 640, 640);
      if (harness.permission === 'pending') return new Promise<MediaStream>((resolve) => { harness.resolve = resolve; });
      return stream;
    } });
    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', { value: async () => [] });
  }, { value: permission, senderStream });
}
async function pointCamera(receiver: Page, dataUrl: string) {
  await receiver.evaluate(async (source) => {
    const canvas = (window as CameraWindow).qrCamera.canvas, context = canvas.getContext('2d')!;
    const image = new Image(); image.src = source; await image.decode();
    context.fillStyle = '#fff'; context.fillRect(0, 0, 640, 640);
    context.drawImage(image, Math.floor((640 - image.width) / 2), Math.floor((640 - image.height) / 2));
  }, dataUrl);
}

for (const offline of [false, true]) {
  test(`animated screen → camera → verified multi-file downloads${offline ? ' entirely offline from a cold tool visit' : ''}`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ serviceWorkers: offline ? 'allow' : 'block', locale: 'en-US' });
    await fakeCamera(context);
    const errors: string[] = [], external: string[] = [];
    context.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
    context.on('request', (request) => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
    try {
      const sender = await context.newPage();
      if (offline) {
        await sender.goto(baseURL!); await sender.evaluate(async () => { await navigator.serviceWorker.ready; }); await sender.reload();
        await expect.poll(() => sender.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
        await context.setOffline(true);
      }
      await sender.goto(`${baseURL}/tools/image/qr-file-transfer`);
      if (offline) await expect(sender.getByText(/Ready for offline use/)).toBeVisible();
      const receiver = await context.newPage(); await receiver.goto(`${baseURL}/tools/image/qr-file-transfer`);
      await receiver.getByRole('tab', { name: 'Receive', exact: true }).click();
      expect(await receiver.evaluate(() => (window as CameraWindow).qrCamera.calls)).toBe(0);
      await receiver.getByRole('button', { name: 'Start receiving', exact: true }).click();
      await expect(receiver.getByText(/Scanning ·/)).toBeVisible();
      const files = [
        { name: '测试图片.png', mimeType: 'image/png', buffer: png },
        { name: 'all-bytes.bin', mimeType: 'application/octet-stream', buffer: binary },
        { name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) },
        { name: 'untrusted.html', mimeType: 'text/html', buffer: Buffer.from('<script>window.evilTransfer = true</script>') },
      ];
      await sender.getByLabel('Choose files to send', { exact: true }).setInputFiles(files);
      await sender.getByLabel('Transfer profile', { exact: true }).selectOption('compatible');
      await sender.getByRole('button', { name: 'Start sending', exact: true }).click();
      await expect(sender.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      const end = Date.now() + 55_000;
      let seenProgress = false, resumed = false, skipped = 0;
      while (Date.now() < end && await receiver.getByRole('link', { name: 'Save file', exact: true }).count() < files.length) {
        const dataUrl = await sender.getByRole('img', { name: 'Animated file data QR code' }).evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
        // Whole-frame losses and repeated exposures are exercised by the real scanner, not a packet injection.
        if (++skipped % 5 !== 0) await pointCamera(receiver, dataUrl);
        if (!resumed && await receiver.getByRole('progressbar').count()) {
          seenProgress = true;
          await receiver.getByRole('button', { name: 'Stop camera', exact: true }).click();
          expect(await receiver.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
          await receiver.getByRole('button', { name: 'Start receiving', exact: true }).click();
          await expect(receiver.getByText(/Scanning ·/)).toBeVisible(); resumed = true;
        }
        await receiver.waitForTimeout(100);
      }
      await expect(receiver.getByRole('heading', { name: 'Verified files (4)' })).toBeVisible();
      expect(seenProgress).toBe(true);
      for (const file of files) {
        const card = receiver.locator('main a[download]').filter({ hasText: 'Save file' }).and(receiver.locator(`a[download="${file.name}"]`));
        const pending = receiver.waitForEvent('download'); await card.click();
        const download = await pending;
        expect(download.suggestedFilename()).toBe(file.name);
        expect(await readFile((await download.path())!)).toEqual(file.buffer);
      }
      await expect(receiver.locator('main img')).toHaveCount(1);
      await expect.poll(() => receiver.locator('main img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
      await expect(receiver.locator('iframe, object, embed')).toHaveCount(0);
      expect(await receiver.evaluate(() => Reflect.get(window, 'evilTransfer'))).toBeUndefined();
      // Another pass cannot duplicate the completed cards.
      await sender.getByRole('button', { name: 'Pause', exact: true }).click();
      const still = await sender.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
      await pointCamera(receiver, still); await receiver.waitForTimeout(250);
      await expect(receiver.getByRole('heading', { name: 'Verified files (4)' })).toBeVisible();
      await receiver.getByRole('button', { name: 'Clear received files', exact: true }).click();
      await expect(receiver.getByRole('heading', { name: 'Verified files (0)' })).toBeVisible();
      expect(await receiver.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
      expect(await receiver.evaluate(() => JSON.stringify(localStorage))).not.toContain('all-bytes.bin');
      expect(external).toEqual([]); expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}

test('permission denial is actionable, late permission and navigation cannot leak a camera', async ({ browser, baseURL }) => {
  const context = await browser.newContext(); await fakeCamera(context, 'deny');
  try {
    const page = await context.newPage(); await page.goto(`${baseURL}/tools/image/qr-file-transfer`);
    await page.getByRole('tab', { name: 'Receive', exact: true }).click();
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Camera permission was denied');
    await page.evaluate(() => { (window as CameraWindow).qrCamera.permission = 'pending'; });
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click();
    await page.getByRole('button', { name: 'Stop camera', exact: true }).click();
    await page.evaluate(() => { const harness = (window as CameraWindow).qrCamera; harness.resolve!(harness.streams[0]!); });
    await expect.poll(() => page.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
    await page.evaluate(() => { (window as CameraWindow).qrCamera.permission = 'allow'; });
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click(); await expect(page.getByText(/Scanning ·/)).toBeVisible();
    await page.getByRole('tab', { name: 'Send', exact: true }).click();
    expect(await page.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
    await page.getByRole('tab', { name: 'Receive', exact: true }).click();
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click(); await expect(page.getByText(/Scanning ·/)).toBeVisible();
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
  } finally { await context.close(); }
});

test('compressed image handoff preserves its output format, is consumed once and never becomes a draft', async ({ page }) => {
  await page.goto('/tools/image/image-compressor');
  await page.locator('main input[type="file"]').setInputFiles({ name: 'demo.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Send via QR', exact: true })).toBeVisible();
  await page.locator('main select').selectOption('image/png'); // changing the next output setting cannot relabel an existing JPEG
  await page.getByRole('button', { name: 'Send via QR', exact: true }).click();
  await expect(page).toHaveURL(/qr-file-transfer$/);
  await expect(page.getByRole('list', { name: 'File queue' })).toContainText('demo-compressed.jpeg');
  await page.getByRole('button', { name: 'Start sending', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('demo-compressed.jpeg');
  await page.reload(); await expect(page.getByRole('button', { name: 'Start sending', exact: true })).toBeDisabled();
});

test('send controls, file bounds, translations and mobile layout', async ({ page }) => {
  await page.goto('/tools/image/qr-file-transfer');
  const background = (element: Element) => getComputedStyle(element).backgroundColor;
  expect(await page.getByRole('tab', { name: 'Send', exact: true }).evaluate(background)).not.toBe(await page.getByRole('tab', { name: 'Receive', exact: true }).evaluate(background));
  expect(await page.getByRole('button', { name: 'Start sending', exact: true }).evaluate((element) => Number(getComputedStyle(element).opacity))).toBeLessThan(1);
  const picker = await page.getByLabel('Choose files to send', { exact: true }).boundingBox();
  expect(picker!.width).toBeLessThanOrEqual(1); expect(picker!.height).toBeLessThanOrEqual(1);
  await page.getByLabel('Choose files to send', { exact: true }).setInputFiles({ name: 'large.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toContainText('5 MiB');
  await page.getByLabel('Choose files to send', { exact: true }).setInputFiles({ name: 'demo.txt', mimeType: 'text/plain', buffer: Buffer.from('offline-demo') });
  await page.getByLabel('Transfer profile', { exact: true }).selectOption('compatible');
  await page.getByLabel('Playback speed', { exact: true }).selectOption('compatible');
  await page.getByRole('button', { name: 'Start sending', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exit full screen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exit full screen', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  const frame = await page.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(450);
  expect(await page.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).toBe(frame);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Stop sending', exact: true }).click();
  const contrast = (element: Element) => {
    const style = getComputedStyle(element);
    const luminance = (color: string) => {
      const channels = color.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map((value) => { const c = Number(value) / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    };
    const a = luminance(style.color), b = luminance(style.backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  await expect.poll(() => page.getByRole('button', { name: 'Start sending', exact: true }).evaluate(contrast)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
  await expect.poll(() => page.getByRole('button', { name: 'Start sending', exact: true }).evaluate(contrast)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.getByRole('heading', { name: '二维码传文件', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('tab', { name: '接收', exact: true }).click();
  await expect(page.getByRole('button', { name: '开始接收', exact: true })).toBeVisible();
});

test('backgrounding, ended camera tracks and permission granted after leaving all release hardware', async ({ browser, baseURL }) => {
  const context = await browser.newContext(); await fakeCamera(context);
  try {
    const page = await context.newPage(); await page.goto(`${baseURL}/tools/image/qr-file-transfer`);
    await page.getByRole('tab', { name: 'Receive', exact: true }).click();
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click(); await expect(page.getByText(/Scanning ·/)).toBeVisible();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(page.getByRole('button', { name: 'Start receiving', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
    await page.evaluate(() => Object.defineProperty(document, 'hidden', { value: false, configurable: true }));
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click(); await expect(page.getByText(/Scanning ·/)).toBeVisible();
    await page.evaluate(() => { const track = (window as CameraWindow).qrCamera.streams.at(-1)!.getVideoTracks()[0]!; track.stop(); track.dispatchEvent(new Event('ended')); });
    await expect(page.getByRole('alert')).toContainText('Camera access ended');
    await page.evaluate(() => { (window as CameraWindow).qrCamera.permission = 'pending'; });
    await page.getByRole('button', { name: 'Start receiving', exact: true }).click();
    await expect.poll(() => page.evaluate(() => Boolean((window as CameraWindow).qrCamera.resolve))).toBe(true);
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${baseURL}/?$`));
    await page.evaluate(() => { const harness = (window as CameraWindow).qrCamera; harness.resolve!(harness.streams.at(-1)!); });
    await expect.poll(() => page.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
  } finally { await context.close(); }
});

for (const profile of ['high', 'extreme'] as const) {
  test(`1 MiB random file through live four-code ${profile} playback and camera capture`, async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await fakeCamera(context, 'allow', true);
    const bytes = randomBytes(1024 * 1024), errors: string[] = [];
    context.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
    try {
      const sender = await context.newPage(); await sender.goto(`${baseURL}/tools/image/qr-file-transfer`);
      await sender.getByLabel('Transfer profile', { exact: true }).selectOption(profile);
      await sender.getByLabel('Choose files to send', { exact: true }).setInputFiles({ name: `random-${profile}.bin`, mimeType: 'application/octet-stream', buffer: bytes });
      await sender.getByRole('button', { name: 'Start sending', exact: true }).click();
      await expect(sender.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      await expect.poll(() => sender.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width)).toBeGreaterThan(1000);
      const popup = sender.waitForEvent('popup');
      await sender.evaluate(() => window.open(location.href, '_blank'));
      const receiver = await popup; await receiver.getByRole('tab', { name: 'Receive', exact: true }).click();
      const start = performance.now();
      await receiver.getByRole('button', { name: 'Start receiving', exact: true }).click();
      await expect(receiver.getByRole('heading', { name: 'Verified files (1)' })).toBeVisible({ timeout: 90_000 });
      const wallMs = performance.now() - start;
      const card = receiver.locator('a[download]');
      const pending = receiver.waitForEvent('download'); await card.click();
      expect(await readFile((await (await pending).path())!)).toEqual(bytes);
      const report = { profile, fileBytes: bytes.length, wallMs, wallKiBps: bytes.length / 1024 / (wallMs / 1000), receive: await receiver.locator('main').innerText(), send: await sender.locator('main').innerText(), runtime: { browser: browser.version(), node: process.version, platform: process.platform, arch: process.arch }, hardware: 'Synthetic canvas.captureStream; no physical display/camera' };
      await mkdir('.playwright-results/qr-speed', { recursive: true });
      await writeFile(`.playwright-results/qr-speed/${profile}.json`, JSON.stringify(report, null, 2));
      await testInfo.attach(`${profile}-throughput`, { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
      expect(errors).toEqual([]);
      // Bound is an acceptance timeout, not a guarantee for real cameras or shared CI CPUs.
      expect(wallMs).toBeLessThan(90_000);
      await sender.getByRole('button', { name: 'Pause', exact: true }).click();
      await sender.getByRole('button', { name: 'Switch language' }).click();
      await expect(sender.getByRole('heading', { name: '二维码传文件', exact: true })).toBeVisible();
      await sender.setViewportSize({ width: 1440, height: 1600 });
      await sender.screenshot({ path: `.playwright-results/qr-speed/${profile}-zh.jpg`, fullPage: true });
      await sender.getByRole('button', { name: '停止发送', exact: true }).click();
      await receiver.getByRole('button', { name: 'Stop camera', exact: true }).click();
      expect(await receiver.evaluate(() => (window as CameraWindow).qrCamera.streams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')))).toBe(true);
    } finally { await context.close(); }
  });
}

test('dense two-code board preserves pixels through pause, resize and restart', async ({ page }) => {
  await page.goto('/tools/image/qr-file-transfer');
  await page.getByLabel('Transfer profile', { exact: true }).selectOption('extreme');
  await page.getByLabel('Parallel QR codes', { exact: true }).selectOption('2');
  await page.getByLabel('Choose files to send', { exact: true }).setInputFiles({ name: 'two-code.bin', mimeType: 'application/octet-stream', buffer: randomBytes(32_000) });
  await page.getByRole('button', { name: 'Start sending', exact: true }).click();
  await expect(page.getByLabel('Transfer profile', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Parallel QR codes', { exact: true })).toBeDisabled();
  await expect.poll(() => page.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width)).toBeGreaterThan(1000);
  await expect.poll(() => page.locator('main canvas').evaluate((canvas) => { const c = canvas as HTMLCanvasElement; return c.width / c.height; })).toBe(2);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const still = await page.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(500);
  expect(await page.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).toBe(still);
  await page.getByLabel('Board size', { exact: true }).selectOption('1200');
  await expect.poll(() => page.locator('main canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width)).toBe(1110);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('main canvas').evaluate((canvas) => canvas.getBoundingClientRect().height)).toBeLessThanOrEqual(844 * 0.6 + 1);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Stop sending', exact: true }).click();
  await page.getByLabel('Transfer profile', { exact: true }).selectOption('compatible');
  await expect(page.getByLabel('Parallel QR codes', { exact: true })).toHaveValue('1');
  await expect(page.getByLabel('Playback speed', { exact: true })).toHaveValue('standard');
  await page.getByRole('button', { name: 'Start sending', exact: true }).click();
  await expect.poll(() => page.locator('main canvas').evaluate((canvas) => { const c = canvas as HTMLCanvasElement; return c.width / c.height; })).toBe(1);
  await page.getByRole('button', { name: 'Stop sending', exact: true }).click();
});
