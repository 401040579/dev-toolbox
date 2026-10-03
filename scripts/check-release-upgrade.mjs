#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const oldZip = process.argv[2] && resolve(process.argv[2]);
if (!oldZip) {
  console.error('Usage: node scripts/check-release-upgrade.mjs OLD_ZIP');
  process.exitCode = 2;
} else {
  await checkUpgrade().catch((error) => {
    console.error(`Upgrade verification FAILED: ${error.stack ?? error}`);
    process.exitCode = 1;
  });
}

async function artifactInfo(root) {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const src = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i.exec(html)?.[1];
  assert.ok(src, `No entry script in ${root}/index.html`);
  const bundlePath = new URL(src, 'http://localhost/').pathname;
  const content = await readFile(resolve(root, '.' + bundlePath));
  return {
    metadata: JSON.parse(await readFile(resolve(root, 'version.json'), 'utf8')),
    bundlePath,
    bundleSha256: createHash('sha256').update(content).digest('hex'),
  };
}

async function toolDefinitions(dir) {
  const tools = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) tools.push(...await toolDefinitions(path));
    else if (entry.name === 'index.ts') {
      const source = await readFile(path, 'utf8');
      const match = /const tool:\s*ToolDefinition\s*=\s*\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?category:\s*['"]([^'"]+)['"]/.exec(source);
      if (match) tools.push({ id: match[1], category: match[2] });
    }
  }
  return tools;
}

async function checkUpgrade() {
  const temp = await mkdtemp(resolve(tmpdir(), 'dev-toolbox-upgrade-'));
  let server;
  let browser;
  let context;
  try {
    const oldRoot = resolve(temp, 'old');
    execFileSync('python3', ['-c', String.raw`
import pathlib, stat, sys, zipfile
root = pathlib.Path(sys.argv[2]).resolve()
with zipfile.ZipFile(sys.argv[1]) as archive:
    for entry in archive.infolist():
        target = (root / entry.filename).resolve()
        if not target.is_relative_to(root) or stat.S_ISLNK(entry.external_attr >> 16):
            raise ValueError('Unsafe ZIP entry: ' + entry.filename)
    archive.extractall(root)
`, oldZip, oldRoot], { stdio: 'pipe' });
    const newRoot = resolve(temp, 'new');
    await cp(resolve(repo, 'dist'), newRoot, { recursive: true });
    const old = await artifactInfo(oldRoot);
    const next = await artifactInfo(newRoot);
    assert.notEqual(old.bundlePath, next.bundlePath, 'Old and new entry bundle URLs must differ');
    assert.notEqual(old.bundleSha256, next.bundleSha256, 'Old and new entry bundle content must differ');
    console.log(JSON.stringify({ oldZip, old, next }, null, 2));

    let activeRoot = oldRoot;
    const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
    server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        let path = resolve(activeRoot, '.' + pathname);
        if (path !== activeRoot && !path.startsWith(activeRoot + sep)) { response.writeHead(403).end(); return; }
        if (path === activeRoot || !extname(path)) path = resolve(activeRoot, 'index.html');
        const body = await readFile(path);
        response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'text/plain', 'Cache-Control': 'no-store' }).end(body);
      } catch (error) {
        console.error(`HTTP ${request.url}: ${error.message}`);
        response.writeHead(404).end();
      }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const zh = JSON.parse(await readFile(resolve(repo, 'src/i18n/zh/common.json'), 'utf8'));
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ locale: 'zh-CN', serviceWorkers: 'allow' });
    context.setDefaultTimeout(20_000);
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('dev-toolbox-lang', 'zh');
      const reports = [];
      window.__releaseReports = reports;
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { reports.push(text); } } });
    });
    const executingBundle = async () => {
      try {
        return await page.evaluate(() => {
          const src = document.querySelector('script[type="module"][src]')?.src;
          return src ? new URL(src).pathname : null;
        });
      } catch { return null; } // Activation reload can briefly destroy the execution context.
    };
    await page.goto(origin);
    await page.evaluate(async () => {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Old service worker did not become ready')), 30_000)),
      ]);
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 30_000 }).toBe(true);
    assert.equal(await executingBundle(), old.bundlePath);
    assert.equal(await page.evaluate(async (path) => Boolean(await caches.match(new URL(path, location.origin).href)), old.bundlePath), true, 'Old entry bundle was not precached');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    console.log(`Old cached runtime controls page: ${old.bundlePath}`);

    // Switch files while retaining the exact origin, context, registration and cache.
    activeRoot = newRoot;
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('Missing old service-worker registration');
      await registration.update();
    });
    const updateButton = page.getByRole('button', { name: zh.common.updateReload, exact: true });
    await expect(updateButton).toBeVisible({ timeout: 45_000 });
    assert.equal(await executingBundle(), old.bundlePath, 'Old runtime should remain active until the update is accepted');
    await updateButton.click();
    await expect.poll(executingBundle, { timeout: 30_000 }).toBe(next.bundlePath);
    await expect(updateButton).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true);
    console.log(`Updated runtime controls page: ${next.bundlePath}`);

    const keySource = await readFile(resolve(repo, 'src/i18n/tool-copy.ts'), 'utf8');
    const keys = Object.fromEntries([...keySource.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)].map((match) => [match[1], match[2]]));
    const tools = await toolDefinitions(resolve(repo, 'src/tools'));
    for (const category of Object.keys(zh.categories)) {
      await page.goto(`${origin}/tools/${category}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(zh.categories[category]);
      await expect(page.locator('main')).toContainText(zh.categoryDesc[category]);
      for (const tool of tools.filter((item) => item.category === category)) {
        const copy = zh.tools[keys[tool.id]];
        assert.ok(copy?.title && copy?.description, `Missing current Chinese copy for ${tool.id}`);
        const card = page.locator(`main a[href="/tools/${category}/${tool.id}"]`);
        await expect(card).toContainText(copy.title);
        await expect(card).toContainText(copy.description);
      }
    }
    console.log(`Chinese categories, descriptions and ${tools.length} cards verified after the cached upgrade`);

    await page.goto(`${origin}/tools/json/json-diff`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(zh.tools.jsonDiff.title);
    await page.getByRole('button', { name: zh.tools.jsonDiff.loadExample, exact: true }).click();
    await expect(page.getByTestId('json-diff-change')).toHaveCount(5);
    await page.getByLabel(zh.tools.jsonDiff.filter, { exact: true }).selectOption('added');
    await expect(page.getByTestId('json-diff-change')).toHaveCount(1);
    await page.getByRole('button', { name: zh.tools.jsonDiff.copyReport, exact: true }).click();
    const report = JSON.parse(await page.evaluate(() => window.__releaseReports.at(-1)));
    assert.deepEqual(report.counts, { total: 5, added: 1, removed: 1, modified: 3 });
    assert.equal(report.changes.length, 5);
    assert.equal(report.version, 1);
    console.log('New JSON Diff lazy chunk loaded and exported the complete example report');
    if (tools.some((tool) => tool.id === 'qr-file-transfer')) {
      const copy = zh.tools.qrTransfer;
      await context.setOffline(true);
      await page.goto(`${origin}/tools/image/qr-file-transfer`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.title);
      await expect(page.getByText(copy.offlineReady, { exact: true })).toBeVisible();
      await page.getByLabel(copy.choose, { exact: true }).setInputFiles({ name: 'upgrade-demo.txt', mimeType: 'text/plain', buffer: Buffer.from('DEMO-1042 offline upgrade') });
      await page.getByRole('button', { name: copy.startSend, exact: true }).click();
      await expect(page.getByRole('button', { name: copy.pause, exact: true })).toBeVisible();
      await expect.poll(() => page.locator('main canvas').evaluate((canvas) => canvas.width)).toBeGreaterThan(300);
      await page.getByRole('tab', { name: copy.receive, exact: true }).click();
      await page.evaluate(() => {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 400;
          const stream = canvas.captureStream(30);
          const drawing = canvas.getContext('2d'); drawing.fillStyle = '#fff'; drawing.fillRect(0, 0, 400, 400);
          return stream;
        } });
      });
      await page.getByRole('button', { name: copy.startReceive, exact: true }).click();
      await expect(page.getByText(copy.scanning, { exact: true })).toBeVisible();
      await page.getByRole('button', { name: copy.stopReceive, exact: true }).click();
      console.log('QR sender and receiver Worker engines started offline after the cache upgrade');
    }
    console.log('Upgrade verification PASSED');
  } finally {
    await Promise.allSettled([context?.close(), browser?.close()]);
    if (server) {
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    }
    await rm(temp, { recursive: true, force: true });
  }
}
