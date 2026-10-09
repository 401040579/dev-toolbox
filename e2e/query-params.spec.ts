import { test, expect } from '@playwright/test';

const query = 'constructor=first&normal=a+b&%5F%5Fproto%5F%5F=%E4%BD%A0%E5%A5%BD%20%26%3D&constructor=second&toString=';

test('Query String parses prototype-named keys and preserves repeated values', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/network/query-string');
  await page.getByPlaceholder('key1=value1&key2=value2', { exact: true }).fill(`?${query}`);
  await expect(page.locator('main tbody tr')).toHaveCount(5);
  await expect(page.locator('main tbody tr td:first-child')).toHaveText(['constructor', 'constructor', 'normal', '__proto__', 'toString']);
  await expect(page.locator('main tbody tr td:nth-child(2)')).toHaveText(['first', 'second', 'a+b', '你好 &=', '']);
  expect(errors).toEqual([]);
});

test('Query String builds prototype-named keys with grouping and percent encoding', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/network/query-string');
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  const rows = [['constructor', 'first'], ['__proto__', '你好 &='], ['constructor', 'second'], ['toString', ''], ['normal', 'a+b']];
  for (const [index, [key, value]] of rows.entries()) {
    if (index > 0) await page.getByRole('button', { name: '+ Add Parameter', exact: true }).click();
    await page.getByPlaceholder('Value', { exact: true }).nth(index).fill(value);
    await page.getByPlaceholder('Key', { exact: true }).nth(index).fill(key);
    await expect(page.getByRole('heading', { name: 'Query String Parser', exact: true })).toBeVisible();
  }
  await expect(page.getByText('?constructor=first&constructor=second&__proto__=%E4%BD%A0%E5%A5%BD%20%26%3D&toString=&normal=a%2Bb', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('URL Parser accepts prototype-named query keys and preserves URL decoding', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/network/url-parser');
  await page.getByPlaceholder('https://example.com/path?query=value#hash', { exact: true }).fill(`https://example.com:8443/path?${query}#part`);
  await expect(page.getByText('Invalid URL format', { exact: true })).toHaveCount(0);
  const rows = page.locator('main table').last().locator('tbody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.locator('td:first-child')).toHaveText(['constructor', 'constructor', 'normal', '__proto__', 'toString']);
  await expect(rows.locator('td:nth-child(2)')).toHaveText(['first', 'second', 'a b', '你好 &=', '']);
  await expect(page.getByText('https://example.com:8443', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
