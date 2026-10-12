import { expect, test } from '@playwright/test';

const original = 'A你🌍👩‍💻!';
const escaped = 'A\\u4f60\\ud83c\\udf0d\\ud83d\\udc69\\u200d\\ud83d\\udcbb!';
const escapedAll = '\\u0041\\u4f60\\ud83c\\udf0d\\ud83d\\udc69\\u200d\\ud83d\\udcbb\\u0021';

for (const escapeAll of [false, true]) {
  test(`Unicode tool preserves supplementary characters with escapeAll=${escapeAll}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/tools/encoding/unicode-escape');
    await page.getByRole('checkbox', { name: 'Escape all characters' }).setChecked(escapeAll);
    const input = page.locator('main textarea');
    const output = page.locator('main pre');
    await input.fill(original);
    await expect(output).toHaveText(escapeAll ? escapedAll : escaped);
    await page.getByRole('button', { name: 'Unescape', exact: true }).click();
    await input.fill(escapeAll ? escapedAll : escaped);
    await expect(output).toHaveText(original);
    expect(errors).toEqual([]);
  });

  test(`Unicode Pipeline round-trips supplementary characters with escapeAll=${escapeAll}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/pipeline');
    await page.getByRole('textbox', { name: 'Input', exact: true }).fill(original);
    await page.getByRole('button', { name: 'Add transform', exact: true }).click();
    await page.getByText(escapeAll ? 'Unicode Escape All' : 'Unicode Escape', { exact: true }).click();
    const output = page.locator('main pre');
    await expect(output).toHaveText(escapeAll ? escapedAll : escaped);
    await page.getByRole('button', { name: 'Add transform', exact: true }).click();
    await page.getByText('Unicode Unescape', { exact: true }).click();
    await expect(output).toHaveText(original);
    expect(errors).toEqual([]);
  });
}
