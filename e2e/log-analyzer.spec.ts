import { test, expect } from '@playwright/test';

test('logs support exact request traces, multiline filters, lossless exports and draft restore', async ({ page }) => {
  const input = '2026-10-02T08:00:00Z INFO requestId=r-1 Start\n2026-10-02T08:00:01Z ERROR requestId=r-1 Failed\n    at processPayment (payment.ts:42:9)\n{"time":"2026-10-02T08:00:02Z","level":"info","requestId":"r-10","msg":"Other"}\n{broken JSON\n';
  await page.goto('/tools/devtools/log-analyzer');
  await page.getByLabel('Log content', { exact: true }).fill(input);
  await expect(page.locator('main')).toContainText('4 of 4 entries');
  await page.getByLabel('Keyword', { exact: true }).fill('PROCESSPAYMENT');
  await expect(page.locator('main')).toContainText('1 of 4 entries');
  await expect(page.getByTestId('log-records')).toContainText('at processPayment');
  await page.getByRole('button', { name: 'Show all logs for request r-1', exact: true }).first().click();
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('');
  await expect(page.locator('main')).toContainText('2 of 4 entries');
  await expect(page.getByTestId('log-records')).not.toContainText('r-10');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download results', exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let downloaded = '';
  for await (const chunk of stream!) downloaded += chunk.toString();
  expect(downloaded).toBe(input.split('{"time"')[0]);
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByLabel('Log content', { exact: true })).toHaveValue(input);
  await expect(page.getByLabel('Request ID', { exact: true })).toHaveValue('r-1');
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.locator('main')).toContainText('4 of 4 entries');
});

test('file ingestion preserves JSONL, enforces size, paginates and fits a narrow screen in Chinese', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('dev-toolbox-lang', 'zh'));
  await page.goto('/tools/devtools/log-analyzer');
  const content = Array.from({ length: 205 }, (_, index) => JSON.stringify({ timestamp: '2026-10-02T08:00:00Z', level: 'info', requestId: 'r-file', message: `Entry ${index}` })).join('\n');
  await page.locator('input[type=file]').setInputFiles({ name: 'sample.jsonl', mimeType: 'application/x-ndjson', buffer: Buffer.from(content) });
  await expect(page.locator('main')).toContainText('显示 205 / 205 条记录');
  await expect(page.getByTestId('log-records').locator('article')).toHaveCount(100);
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.locator('main')).toContainText('第 2 / 3 页');
  await expect(page.getByTestId('log-records')).toContainText('Entry 100');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('input[type=file]').setInputFiles({ name: 'large.log', mimeType: 'text/plain', buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 65) });
  await expect(page.getByRole('alert')).toContainText('输入超过 10 MiB');
  await expect(page.getByLabel('日志内容', { exact: true })).toHaveValue(content);
});

test('a slow file read never replaces more recent pasted content', async ({ page }) => {
  await page.addInitScript(() => {
    const original = File.prototype.text;
    File.prototype.text = async function () {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return original.call(this);
    };
  });
  await page.goto('/tools/devtools/log-analyzer');
  await page.locator('input[type=file]').setInputFiles({ name: 'slow.log', mimeType: 'text/plain', buffer: Buffer.from('INFO old file') });
  await page.getByLabel('Log content', { exact: true }).fill('INFO New pasted input');
  await expect(page.locator('main')).toContainText('1 of 1 entries');
  await page.waitForTimeout(600);
  await expect(page.getByLabel('Log content', { exact: true })).toHaveValue('INFO New pasted input');
});
