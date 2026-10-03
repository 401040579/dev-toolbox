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
