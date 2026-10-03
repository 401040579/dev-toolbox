import { test, expect } from '@playwright/test';

test.describe('Smart Paste', () => {
  test('suggests a tool without navigating, then delivers input through an explicit selection', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Smart Paste', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    const input = dialog.getByLabel('Content', { exact: true });
    await expect(input).toBeFocused();
    const payload = '{"orders":[{"status":"paid"}],"note":"private payload"}';
    await input.fill(payload);
    await expect(dialog.getByRole('button', { name: /^JSON Formatter/ })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await dialog.getByRole('button', { name: /^JSON Formatter/ }).click();
    await expect(page).toHaveURL(/\/tools\/json\/json-formatter$/);
    await expect(page.locator('textarea').first()).toHaveValue(payload);
    await expect(dialog).not.toBeVisible();
  });

  test('sets decode mode and replaces a previously opened tool input', async ({ page }) => {
    await page.goto('/tools/encoding/base64');
    await page.locator('textarea').first().fill('old tool input');
    await page.getByRole('button', { name: 'Smart Paste', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    await dialog.getByLabel('Content', { exact: true }).fill('aGVsbG8gd29ybGQ=');
    await dialog.getByRole('button', { name: /^Base64 Encode\/Decode/ }).click();
    await expect(page).toHaveURL(/\/tools\/encoding\/base64$/);
    await expect(page.locator('textarea').first()).toHaveValue('aGVsbG8gd29ybGQ=');
    await expect(page.getByText('hello world', { exact: true })).toBeVisible();
  });

  test('reads the clipboard only on request and supports manual paste after rejection', async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as unknown as { smartPasteReads: number };
      state.smartPasteReads = 0;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: async () => {
            state.smartPasteReads += 1;
            throw new DOMException('Permission denied', 'NotAllowedError');
          },
        },
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Smart Paste', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    expect(await page.evaluate(() => (window as unknown as { smartPasteReads: number }).smartPasteReads)).toBe(0);
    await dialog.getByRole('button', { name: 'Read clipboard', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('Paste manually');
    expect(await page.evaluate(() => (window as unknown as { smartPasteReads: number }).smartPasteReads)).toBe(1);
    await dialog.getByLabel('Content', { exact: true }).fill('https://example.com/private?key=value');
    await dialog.getByRole('button', { name: /^URL Parser/ }).click();
    await expect(page).toHaveURL(/\/tools\/network\/url-parser$/);
    await expect(page.locator('input[type="text"]').first()).toHaveValue('https://example.com/private?key=value');
  });

  test('opens timestamps with the converter tab and millisecond precision, including its boundary', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Smart Paste', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    await dialog.getByLabel('Content', { exact: true }).fill('1000000000000');
    await dialog.getByRole('button', { name: /^Epoch Converter/ }).click();
    await expect(page).toHaveURL(/\/tools\/time\/epoch-converter$/);
    await expect(page.locator('input[type="text"]').first()).toHaveValue('1000000000000');
    await expect(page.getByText('2001-09-09T01:46:40.000Z', { exact: true })).toBeVisible();
  });

  test('opens a JWT for inspection and retains the plain-text fallback for ordinary content', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Smart Paste', exact: true }).first().click();
    let dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.AQID';
    await dialog.getByLabel('Content', { exact: true }).fill(token);
    await dialog.getByRole('button', { name: /^JWT Decode/ }).click();
    await expect(page).toHaveURL(/\/tools\/encoding\/jwt-decode$/);
    await expect(page.locator('textarea').first()).toHaveValue(token);
    await expect(page.locator('pre').filter({ hasText: '"sub": "123"' })).toBeVisible();
    await page.getByRole('button', { name: 'Smart Paste', exact: true }).first().click();
    dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    await dialog.getByLabel('Content', { exact: true }).fill('ordinary words');
    await dialog.getByRole('button', { name: /^Text Statistics/ }).click();
    await expect(page).toHaveURL(/\/tools\/text\/text-stats$/);
    await expect(page.locator('textarea').first()).toHaveValue('ordinary words');
  });

  test('closes with Escape and is usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const entry = page.getByRole('button', { name: 'Smart Paste', exact: true }).first();
    await entry.click();
    const dialog = page.getByRole('dialog', { name: 'Smart Paste' });
    await dialog.getByLabel('Content', { exact: true }).fill('plain words');
    await expect(dialog.getByRole('button', { name: /^Text Statistics/ })).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(entry).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
  });
});
