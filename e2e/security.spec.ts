import { test, expect, type Page } from '@playwright/test';
import jsQR from 'jsqr';
import LZString from 'lz-string';
import { readFile } from 'node:fs/promises';

async function observe(page: Page) {
  const requests: string[] = [];
  const dialogs: string[] = [];
  await page.route('https://**/*', (route) => route.abort());
  page.on('request', (request) => {
    if (!request.url().startsWith('http://localhost:4173/')) requests.push(request.url());
  });
  page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  return { requests, dialogs };
}

async function decodeQr(page: Page) {
  const pixels = await page.locator('main img').evaluate((element) => {
    const image = element as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height, data: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) };
  });
  return jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data;
}

test('QR preview and downloaded SVG decode locally without any external requests', async ({ page }) => {
  const observed = await observe(page);
  await page.goto('/tools/generators/qrcode-generator');
  const content = 'POS demo 订单 DEMO-1042 + token=QR_SENTINEL';
  await page.locator('main textarea').fill(content);
  await expect(page.locator('main img')).toBeVisible();
  await expect.poll(() => decodeQr(page)).toBe(content);
  await page.locator('main select').selectOption('512');
  await expect(page.locator('main img')).toHaveAttribute('width', '512');
  await expect.poll(() => decodeQr(page)).toBe(content);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('qrcode.svg');
  const exported = await readFile((await download.path())!, 'utf8');
  await page.locator('main img').evaluate((element, svg) => {
    (element as HTMLImageElement).src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, exported);
  await expect.poll(() => decodeQr(page)).toBe(content);
  await page.locator('main textarea').fill('x'.repeat(5000));
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
  expect(observed.requests).toEqual([]);
  expect(observed.dialogs).toEqual([]);
});

test('Markdown payloads cannot execute or load resources; normal content remains usable', async ({ page }) => {
  const observed = await observe(page);
  await page.goto('/tools/text/markdown-preview');
  const payloads = [
    '[Click](x" onclick="window.__xss=7")',
    '[Click](x" style="animation:spin 1s" onanimationstart="window.__xss=8")',
    '[Click](javascript:alert%281%29)',
    '[Click](data:text/html,<script>alert(1)</script>)',
    '<svg onload="window.__xss=11"><foreignObject><img src="https://example.invalid/MD_SENTINEL" onerror="alert(1)"></foreignObject></svg>',
    '![Image](https://example.invalid/MD_SENTINEL)',
    '<style>@import url(https://example.invalid/MD_SENTINEL);</style>',
  ];
  for (const payload of payloads) {
    await page.locator('main textarea').fill(payload);
    for (const link of await page.locator('main .prose a').all()) await link.click();
    await page.waitForTimeout(80);
    expect(await page.evaluate(() => Reflect.get(window, '__xss'))).toBeUndefined();
    await expect(page.locator('main .prose img, main .prose svg, main .prose style')).toHaveCount(0);
  }
  await page.locator('main textarea').fill('# Incident DEMO-1042\n\n1. Decode\n2. Inspect\n\n```json\n{"status":"ready"}\n```\n\n[Docs](https://example.com)\n\n| Key | Value |\n| --- | --- |\n| id | DEMO-1042 |');
  await expect(page.locator('main .prose h1')).toHaveText('Incident DEMO-1042');
  await expect(page.locator('main .prose ol li')).toHaveCount(2);
  await expect(page.locator('main .prose code')).toContainText('"status":"ready"');
  await expect(page.locator('main .prose table')).toBeVisible();
  await expect(page.locator('main .prose a')).toHaveAttribute('href', 'https://example.com');
  expect(observed.requests).toEqual([]);
  expect(observed.dialogs).toEqual([]);
});

test('SVG malicious input is safe both in preview and standalone exported SVG', async ({ page }) => {
  const observed = await observe(page);
  await page.goto('/tools/image/svg-optimizer');
  await page.locator('main textarea').first().fill(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0 0 100 100" onload="window.__xss=12">
    <script>alert('SVG_SCRIPT')</script><style>@import 'https://example.invalid/SVG_SENTINEL';</style>
    <foreignObject><img src="https://example.invalid/SVG_SENTINEL" onerror="alert(1)"/></foreignObject>
    <image href="https://example.invalid/SVG_SENTINEL"/><use xlink:href="https://example.invalid/SVG_SENTINEL#x"/>
    <rect width="100" height="100" fill="red" onclick="alert(1)"/>
    <rect fill="url(https://example.invalid/SVG_SENTINEL)" style="fill:url(https://example.invalid/SVG_SENTINEL)"/>
    <animate attributeName="href" values="javascript:alert(1)"/><set attributeName="onload" to="alert(1)"/>
  </svg>`);
  await page.getByRole('button', { name: 'Optimize', exact: true }).click();
  await expect(page.locator('main img')).toBeVisible();
  await expect.poll(() => page.locator('main img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(100);
  const pixel = await page.locator('main img').evaluate((element) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 100;
    const context = canvas.getContext('2d')!; context.drawImage(element as HTMLImageElement, 0, 0);
    return Array.from(context.getImageData(50, 50, 1, 1).data);
  });
  expect(pixel).toEqual([255, 0, 0, 255]);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG' }).click();
  const exported = await readFile((await (await pending).path())!, 'utf8');
  await page.goto(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(exported)}`);
  await page.locator('rect').first().click({ position: { x: 30, y: 30 } });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => Reflect.get(window, '__xss'))).toBeUndefined();
  expect(observed.requests.filter((url) => !url.startsWith('data:'))).toEqual([]);
  expect(observed.dialogs).toEqual([]);
});

test('Gradient colors cannot inject background resource layers', async ({ page }) => {
  const observed = await observe(page);
  await page.goto('/tools/color/gradient-generator');
  await page.locator('main input[type=text]').first().fill('red 0%, blue 100%),url(https://example.invalid/GRADIENT_SENTINEL),linear-gradient(red');
  await page.waitForTimeout(200);
  expect(observed.requests).toEqual([]);
  await page.locator('main input[type=text]').first().fill('rgb(255, 0, 0)');
  await expect(page.locator('main [style]').first()).toHaveCSS('background-image', /linear-gradient.*rgb\(255, 0, 0\)/);
});

test('share hash is validated before automatic execution and text stays inert', async ({ page }) => {
  const observed = await observe(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const data of [{ nodes: [null], input: {} }, { nodes: [{ transformId: 'base64-encode', options: { evil: {} } }], input: 'demo' }]) {
    await page.goto(`/pipeline#config=${LZString.compressToEncodedURIComponent(JSON.stringify(data))}`);
    await expect(page.locator('main h1')).toHaveText('Pipeline Builder');
    await expect(page.locator('main textarea').first()).toHaveValue('');
  }
  const input = '<img src="https://example.invalid/PIPELINE_SENTINEL" onerror="alert(1)">';
  const data = { nodes: [{ transformId: 'base64-encode', options: {} }, { transformId: 'base64-decode', options: {} }], input };
  await page.goto(`/pipeline#config=${LZString.compressToEncodedURIComponent(JSON.stringify(data))}`);
  await expect(page.locator('main textarea').first()).toHaveValue(input);
  await expect(page.locator('main pre').last()).toHaveText(input);
  await expect(page.locator('main img')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(observed.requests).toEqual([]);
  expect(observed.dialogs).toEqual([]);
});
