import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSON_DIFF_LIMITS } from '../src/tools/json/json-diff/comparison';

interface ToolCopy {
  title: string;
  left: string;
  right: string;
  equal: string;
  clear: string;
  loadExample: string;
  filter: string;
  absent: string;
  copyReport: string;
  downloadReport: string;
  errors: { invalidJson: string; tooDeep: string; tooManyChanges: string };
}
const en = JSON.parse(readFileSync(resolve('src/i18n/en/common.json'), 'utf8')).tools.jsonDiff as ToolCopy;
const zh = JSON.parse(readFileSync(resolve('src/i18n/zh/common.json'), 'utf8')).tools.jsonDiff as ToolCopy;

for (const width of [390, 1280]) {
  test.describe(`JSON structural diff at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('ignores key order while preserving types, array order, missing values and safe paths', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/tools/json/json-diff');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.title);
      const left = page.getByLabel(en.left, { exact: true });
      const right = page.getByLabel(en.right, { exact: true });
      await left.fill('{"a":1,"nested":{"x":true,"y":null}}');
      await right.fill('{"nested":{"y":null,"x":true},"a":1}');
      await expect(page.getByText(en.equal, { exact: true })).toBeVisible();
      const longKey = 'quoted"key.' + 'x'.repeat(500);
      const original = { items: [1, 2], removed: null, type: 1, [longKey]: 'old'.repeat(400) };
      const updated = { items: [2, 1], added: null, type: '1', [longKey]: 'new'.repeat(400) };
      await left.fill(JSON.stringify(original));
      await right.fill(JSON.stringify(updated));
      const changes = page.getByTestId('json-diff-change');
      await expect(changes).toHaveCount(6);
      await expect(changes.filter({ hasText: '$.items[0]' })).toContainText('Modified');
      await expect(changes.filter({ hasText: '$.type' })).toContainText('"1"');
      await expect(changes.filter({ hasText: '$.added' })).toContainText(en.absent);
      await expect(changes.filter({ hasText: '$.added' }).locator('pre')).toHaveText('null');
      await expect(changes.filter({ hasText: `$[${JSON.stringify(longKey)}]` })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await left.fill('{"__proto__":{"jsonDiffMarker":1},"constructor":{"prototype":{"jsonDiffMarker":1}}}');
      await right.fill('{"__proto__":{"jsonDiffMarker":2},"constructor":{"prototype":{"jsonDiffMarker":3}}}');
      await expect(changes).toHaveCount(2);
      await expect(changes.filter({ hasText: '$["constructor"]["prototype"].jsonDiffMarker' })).toHaveCount(1);
      expect(await page.evaluate(() => ({
        object: Object.prototype.hasOwnProperty.call(Object.prototype, 'jsonDiffMarker'),
        function: Object.prototype.hasOwnProperty.call(Function.prototype, 'jsonDiffMarker'),
      }))).toEqual({ object: false, function: false });
      expect(errors).toEqual([]);
    });

    test('filters results, copies and downloads complete JSON reports, and clears both inputs', async ({ page }) => {
      await page.addInitScript(() => {
        const copied: string[] = [];
        Object.defineProperty(window, '__jsonDiffCopied', { value: copied });
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (value: string) => { copied.push(value); } } });
      });
      await page.goto('/tools/json/json-diff');
      await page.getByRole('button', { name: en.loadExample, exact: true }).click();
      await expect(page.getByTestId('json-diff-change')).toHaveCount(5);
      await page.getByLabel(en.filter, { exact: true }).selectOption('added');
      await expect(page.getByTestId('json-diff-change')).toHaveCount(1);
      await page.getByRole('button', { name: en.copyReport, exact: true }).click();
      const copied = await page.evaluate(() => (window as unknown as { __jsonDiffCopied: string[] }).__jsonDiffCopied);
      const report = JSON.parse(copied[0]!);
      expect(report.version).toBe(1);
      expect(report.counts).toEqual({ total: 5, added: 1, removed: 1, modified: 3 });
      expect(report.changes).toHaveLength(5);
      const waitForDownload = page.waitForEvent('download');
      await page.getByRole('button', { name: en.downloadReport, exact: true }).click();
      const download = await waitForDownload;
      expect(download.suggestedFilename()).toBe('json-diff-report.json');
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      expect(JSON.parse(Buffer.concat(chunks).toString('utf8'))).toEqual(report);
      await page.getByRole('button', { name: en.clear, exact: true }).click();
      await expect(page.getByLabel(en.left, { exact: true })).toHaveValue('');
      await expect(page.getByLabel(en.right, { exact: true })).toHaveValue('');
      await expect(page.getByTestId('json-diff-change')).toHaveCount(0);
      await expect(page.getByRole('button', { name: en.downloadReport, exact: true })).toHaveCount(0);
    });

    test('localizes invalid JSON and resource-limit errors without stale reports', async ({ page }) => {
      await page.goto('/tools/json/json-diff');
      await page.getByRole('button', { name: en.loadExample, exact: true }).click();
      await expect(page.getByTestId('json-diff-change')).toHaveCount(5);
      await page.getByLabel(en.left, { exact: true }).fill('{"broken":}');
      await expect(page.getByRole('alert')).toContainText(en.errors.invalidJson.replace('{{side}}', en.left));
      await expect(page.getByTestId('json-diff-change')).toHaveCount(0);
      await expect(page.getByRole('button', { name: en.copyReport, exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Switch language', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(zh.title);
      await expect(page.getByRole('alert')).toContainText(zh.errors.invalidJson.replace('{{side}}', zh.left));
      for (const number of ['1e-400', '9007199254740991.1', '0.10000000000000001']) {
        await page.getByLabel(zh.left, { exact: true }).fill(`{"value":${number}}`);
        await expect(page.getByRole('alert')).toContainText(zh.errors.unsupportedNumber.replace('{{side}}', zh.left));
        await expect(page.getByTestId('json-diff-change')).toHaveCount(0);
      }
      const depth = JSON_DIFF_LIMITS.depth + 1;
      await page.getByLabel(zh.left, { exact: true }).fill('['.repeat(depth) + '0' + ']'.repeat(depth));
      await expect(page.getByRole('alert')).toContainText(zh.errors.tooDeep.replace('{{side}}', zh.left).replace('{{depth}}', String(JSON_DIFF_LIMITS.depth)));
      await page.getByLabel(zh.left, { exact: true }).fill(JSON.stringify(Array(JSON_DIFF_LIMITS.changes + 1).fill(0)));
      await page.getByLabel(zh.right, { exact: true }).fill(JSON.stringify(Array(JSON_DIFF_LIMITS.changes + 1).fill(1)));
      await expect(page.getByRole('alert')).toContainText(zh.errors.tooManyChanges.replace('{{changes}}', String(JSON_DIFF_LIMITS.changes)));
      await expect(page.getByTestId('json-diff-change')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: zh.clear, exact: true }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('main')).not.toContainText('tools.jsonDiff.');
    });
  });
}
