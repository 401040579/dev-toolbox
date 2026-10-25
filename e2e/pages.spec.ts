import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import LZString from 'lz-string';

test('actual Pages 404 redirect restores tool route, search and hash before Router starts', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const html = await readFile('public/404.html', 'utf8');
  await page.route(`${baseURL}/tools/text/sms-segment**`, (route) => route.fulfill({ status: 404, contentType: 'text/html', body: html }));
  await page.goto('/tools/text/sms-segment?demo=1&view=encoding#demo');
  await expect(page.locator('main h1')).toHaveText('SMS Segment Calculator');
  await expect(page).toHaveURL(`${baseURL}/tools/text/sms-segment?demo=1&view=encoding#demo`);
  expect(errors).toEqual([]);
});

test('actual Pages 404 redirect preserves shared Pipeline configuration', async ({ page, baseURL }) => {
  const html = await readFile('public/404.html', 'utf8');
  const encoded = LZString.compressToEncodedURIComponent(JSON.stringify({ nodes: [{ transformId: 'base64-encode', options: {} }], input: 'DEMO-1042' }));
  await page.route(`${baseURL}/pipeline`, (route) => route.fulfill({ status: 404, contentType: 'text/html', body: html }));
  await page.goto(`/pipeline#config=${encoded}`);
  await expect(page.locator('main h1')).toHaveText('Pipeline Builder');
  await expect(page.locator('main pre').last()).toHaveText('REVNTy0xMDQy');
  await expect(page).toHaveURL(`${baseURL}/pipeline#config=${encoded}`);
});

test('sitemap and robots are served and the static route shell boots the same app with per-page metadata', async ({ page, baseURL }) => {
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain('<loc>https://app.aiuos.com/tools/text/sms-segment</loc>');
  const robots = await page.request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://app.aiuos.com/sitemap.xml');

  const shell = await readFile('dist/tools/text/sms-segment.html', 'utf8');
  const index = await readFile('dist/index.html', 'utf8');
  const assetRefs = (html: string) => [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]).sort();
  expect(assetRefs(shell)).toEqual(assetRefs(index));
  expect(assetRefs(shell).length).toBeGreaterThan(0);
  expect(shell).toContain('<title>SMS Segment Calculator — Dev Toolbox</title>');
  expect(shell).toContain('<link rel="canonical" href="https://app.aiuos.com/tools/text/sms-segment" />');
  expect(shell).toContain('<meta property="og:url" content="https://app.aiuos.com/tools/text/sms-segment" />');
  expect(shell).toMatch(/<meta name="description" content="Calculate SMS encoding, segment count, and character usage\. [^"]+" \/>/);

  // GitHub Pages serves tools/text/sms-segment.html for the extensionless route with HTTP 200.
  await page.route(`${baseURL}/tools/text/sms-segment`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: shell }));
  await page.goto('/tools/text/sms-segment');
  await expect(page.locator('main h1')).toHaveText('SMS Segment Calculator');
  await expect(page).toHaveTitle('SMS Segment Calculator — Dev Toolbox');
  await page.getByRole('link', { name: /^Pipeline/ }).first().click();
  await expect(page).toHaveURL(`${baseURL}/pipeline`);
  await expect(page).toHaveTitle('Pipeline Builder — Dev Toolbox');
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${baseURL}/pipeline`);
});
