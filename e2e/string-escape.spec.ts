import { test, expect } from '@playwright/test';

test('JavaScript escaping preserves words and distinguishes literal escapes from controls', async ({ page }) => {
  await page.goto('/tools/text/string-escape');
  await page.getByRole('combobox').selectOption('javascript');
  const input = page.locator('textarea').first();
  const output = page.locator('textarea[readonly]');

  await input.fill('hello');
  await expect(output).toHaveValue('hello');

  const original = 'hello\\n\n\t\b\'"\\';
  const escaped = String.raw`hello\\n\n\t\b\'\"\\`;
  await input.fill(original);
  await expect(output).toHaveValue(escaped);
  await page.getByRole('button', { name: 'Unescape', exact: true }).click();
  await input.fill(escaped);
  await expect(output).toHaveValue(original);
});
