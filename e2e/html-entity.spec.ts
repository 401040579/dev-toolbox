import { expect, test } from '@playwright/test';

const original = '<A🌍 & 👩‍💻>';
const encoded = '&lt;A🌍 &amp; 👩‍💻&gt;';
const encodedAll = '&#60;A&#127757; &#38; &#128105;&#8205;&#128187;&#62;';

for (const encodeAll of [false, true]) {
  test(`HTML Entity tool round-trips supplementary characters with encodeAll=${encodeAll}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/tools/encoding/html-entity');
    await page.getByRole('checkbox', { name: 'Encode all characters' }).setChecked(encodeAll);
    const input = page.locator('main textarea');
    const output = page.locator('main pre');
    await input.fill(original);
    await expect(output).not.toHaveText('');
    const actualEncoded = (await output.textContent())!;
    await page.getByRole('button', { name: 'Decode', exact: true }).click();
    await input.fill(actualEncoded);
    await expect(output).toHaveText(original);
    expect(actualEncoded).toBe(encodeAll ? encodedAll : encoded);
    expect(errors).toEqual([]);
  });

  test(`HTML Entity Pipeline round-trips supplementary characters with encodeAll=${encodeAll}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/pipeline');
    await page.getByRole('textbox', { name: 'Input', exact: true }).fill(original);
    await page.getByRole('button', { name: 'Add transform', exact: true }).click();
    await page.getByText(encodeAll ? 'HTML Encode All' : 'HTML Encode', { exact: true }).click();
    const output = page.locator('main pre');
    await expect(output).toContainText(encodeAll ? '&#60;' : '&lt;');
    const actualEncoded = (await output.textContent())!;
    await page.getByRole('button', { name: 'Add transform', exact: true }).click();
    await page.getByText('HTML Decode', { exact: true }).click();
    await expect(output).toHaveText(original);
    expect(actualEncoded).toBe(encodeAll ? encodedAll : encoded);
    expect(errors).toEqual([]);
  });
}
