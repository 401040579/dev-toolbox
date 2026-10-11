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

test('HTML escaping round-trips literal entity references and Unicode text', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/text/string-escape');
  await page.getByRole('combobox').selectOption('html');
  const input = page.locator('main textarea:not([readonly])');
  const output = page.locator('main textarea[readonly]');
  const original = '&lt;demo&gt; &quot;quoted&quot; &#65; 你好 🌍';
  const escaped = '&amp;lt;demo&amp;gt; &amp;quot;quoted&amp;quot; &amp;#65; 你好 🌍';

  await input.fill(original);
  await expect(output).toHaveValue(escaped);
  await page.getByRole('button', { name: 'Unescape', exact: true }).click();
  await input.fill(escaped);
  await expect(output).toHaveValue(original);
  expect(errors).toEqual([]);
});

test('HTML unescaping decodes one layer per explicit operation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/text/string-escape');
  await page.getByRole('combobox').selectOption('html');
  await page.getByRole('button', { name: 'Unescape', exact: true }).click();
  const input = page.locator('main textarea:not([readonly])');
  const output = page.locator('main textarea[readonly]');

  await input.fill('&amp;lt; &lt; &amp;#65; &#65; &amp;#x27; &#x27;');
  const first = "&lt; < &#65; A &#x27; '";
  await expect(output).toHaveValue(first);
  await input.fill(first);
  await expect(output).toHaveValue("< < A A ' '");
  expect(errors).toEqual([]);
});
