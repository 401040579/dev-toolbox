import { test, expect } from '@playwright/test';

test('end truncation keeps short limits and custom markers within the displayed budget', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/text/truncate');
  await page.getByPlaceholder('Enter text to truncate...', { exact: true }).fill('abcdefghij');
  const length = page.locator('main input[type="number"]');
  const ending = page.locator('main input[type="text"]');
  const output = page.locator('main textarea[readonly]');

  for (const [limit, expected] of [[1, '.'], [2, '..'], [3, '...'], [4, 'a...']] as const) {
    await length.fill(String(limit));
    await expect(output).toHaveValue(expected);
  }
  await length.fill('2');
  await ending.fill('[cut]');
  await expect(output).toHaveValue('[c');
  expect(errors).toEqual([]);
});

test('middle truncation does not append the full input at a zero suffix budget', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/text/truncate');
  await page.getByPlaceholder('Enter text to truncate...', { exact: true }).fill('abcdefghij');
  await page.locator('main select').selectOption('middle');
  const length = page.locator('main input[type="number"]');
  const ending = page.locator('main input[type="text"]');
  const output = page.locator('main textarea[readonly]');

  for (const [limit, expected] of [[1, '.'], [2, '..'], [3, '...'], [4, 'a...'], [5, 'a...j']] as const) {
    await length.fill(String(limit));
    await expect(output).toHaveValue(expected);
  }
  await ending.fill('');
  await length.fill('1');
  await expect(output).toHaveValue('a');
  expect(errors).toEqual([]);
});

test('truncation preserves valid surrogate pairs while retaining UTF-16 result counts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/text/truncate');
  const input = page.getByPlaceholder('Enter text to truncate...', { exact: true });
  const length = page.locator('main input[type="number"]');
  const ending = page.locator('main input[type="text"]');
  const output = page.locator('main textarea[readonly]');

  await input.fill('abcdefghij');
  await length.fill('2');
  await ending.fill('A😀B');
  await expect(output).toHaveValue('A');
  await length.fill('3');
  await expect(output).toHaveValue('A😀');
  await expect(page.locator('main .grid > div').nth(1).locator('p').first()).toHaveText('3');

  await ending.fill('...');
  await input.fill('A😀BCDEF');
  await length.fill('5');
  await expect(output).toHaveValue('A...');
  await page.locator('main select').selectOption('middle');
  await input.fill('😀abcdef😀');
  await length.fill('6');
  await expect(output).toHaveValue('😀...');
  expect(errors).toEqual([]);
});
