import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import LZString from 'lz-string';

const browser = await chromium.launch();
let server;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'en-US', serviceWorkers: 'block' });
  if (process.argv.includes('--icons')) {
    const svg = readFileSync('public/icons/icon-192.svg', 'utf8');
    for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-512-maskable.png', 512]]) {
      const png = await page.evaluate(async ({ svg, size, maskable }) => {
        const image = new Image(); image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
        const context = canvas.getContext('2d'); context.fillStyle = '#0f1117'; context.fillRect(0, 0, size, size);
        const padding = maskable ? size * 0.16 : 0;
        context.drawImage(image, padding, padding, size - padding * 2, size - padding * 2);
        return canvas.toDataURL('image/png').split(',')[1];
      }, { svg, size, maskable: name.includes('maskable') });
      writeFileSync(`public/icons/${name}`, Buffer.from(png, 'base64'));
    }
  } else {
    server = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch('http://localhost:4173')).ok) break; } catch { /* Wait for local preview. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    mkdirSync('docs/screenshots', { recursive: true });
    await page.goto('http://localhost:4173/tools/text/sms-segment');
    await page.locator('main textarea').fill('Order DEMO-1042 is “ready”—collect at the demo desk. Reply “YES” to confirm your pickup time. Thank you!');
    await page.getByText('UCS-2', { exact: true }).first().waitFor();
    await page.screenshot({ path: 'docs/screenshots/sms-segment.png' });
    const data = {
      nodes: [{ transformId: 'base64-decode', options: {} }, { transformId: 'json-prettify', options: {} }],
      input: Buffer.from(JSON.stringify({ event: 'order.ready', orderId: 'DEMO-1042', storeId: 'DEMO-STORE', total: 12.5, currency: 'USD' })).toString('base64'),
    };
    await page.goto(`http://localhost:4173/pipeline#config=${LZString.compressToEncodedURIComponent(JSON.stringify(data))}`);
    await page.locator('main pre').last().filter({ hasText: 'DEMO-1042' }).waitFor();
    await page.screenshot({ path: 'docs/screenshots/pipeline.png' });
  }
} finally {
  await browser.close();
  server?.kill('SIGTERM');
}
