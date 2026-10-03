import { test, expect } from '@playwright/test';

test('production cache serves tools after a successful visit without a connection', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: 'en-US', serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.goto(`${baseURL}/tools/generators/qrcode-generator`);
    await page.locator('main textarea').fill('OFFLINE-DEMO-1042');
    await expect.poll(() => page.locator('main img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(256);
    await page.goto(`${baseURL}/pipeline`);
    await page.getByRole('button', { name: /templates/i }).click();
    await page.getByText('Base64 → JSON Pretty', { exact: true }).click();
    await expect(page.locator('main pre').last()).toContainText('DEMO-1042');
  } finally {
    await context.close();
  }
});

test('a waiting service-worker update can be activated through the app', async ({ browser }) => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const { resolve, extname } = await import('node:path');
  const root = resolve('dist');
  let revision = 1;
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url!, 'http://localhost').pathname;
      let file = resolve(root, '.' + path);
      if (!file.startsWith(root + '/') && file !== root) { response.writeHead(403).end(); return; }
      if (file === root || !extname(file)) file = resolve(root, 'index.html');
      let body = await readFile(file);
      const mime: Record<string, string> = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
      if (path === '/sw.js') {
        body = Buffer.concat([body, Buffer.from(`\nself.addEventListener('message', e => { if(e.data === 'TEST_REVISION') e.ports[0].postMessage(${revision}); });`)]);
      }
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'text/plain', 'Cache-Control': 'no-store' }).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const port = (server.address() as { port: number }).port;
  const context = await browser.newContext({ locale: 'en-US', serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}`);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    revision = 2;
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect(page.getByRole('button', { name: 'Reload to update' })).toBeVisible();
    await page.getByRole('button', { name: 'Reload to update' }).click();
    await expect.poll(async () => {
      try {
        return await page.evaluate(() => new Promise<number>((done) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => done(event.data);
          navigator.serviceWorker.controller!.postMessage('TEST_REVISION', [channel.port2]);
        }));
      } catch { return 0; }
    }).toBe(2);
    await expect(page.getByRole('button', { name: 'Reload to update' })).toHaveCount(0);
  } finally {
    await context.close();
    await new Promise<void>((done) => server.close(() => done()));
  }
});
