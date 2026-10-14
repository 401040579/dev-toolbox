import { expect, test } from '@playwright/test';

for (const [base, index, expectedCopy] of [
  ['hex', 1, '0x-FF'],
  ['bin', 2, '0b-11111111'],
  ['oct', 3, '0o-377'],
] as const) {
  test(`Number Base reads its copied negative ${base} output`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Capture only this synthetic clipboard write without touching the system clipboard.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async (text: string) => {
          (window as Window & { copiedNumber?: string }).copiedNumber = text;
        } },
      });
    });
    await page.goto('/tools/encoding/number-base');
    const input = page.getByPlaceholder('Enter a number...');
    const results = page.locator('main code');
    await input.fill('-255');
    await expect(results.first()).toHaveText('-255');
    await results.nth(index).locator('..').getByRole('button').click();
    const copied = await page.evaluate(() => (window as Window & { copiedNumber?: string }).copiedNumber);
    expect(copied).toBe(expectedCopy);
    await page.getByRole('combobox').selectOption(base);
    await input.fill(copied!);
    await expect(results.first()).toHaveText('-255');
    await expect(results).toHaveText(['-255', '-FF', '-11111111', '-377']);
    expect(errors).toEqual([]);
  });
}

for (const [encode, decode, expectedEncoded] of [
  ['Decimal → Hex', 'Hex → Decimal', '-FF'],
  ['Decimal → Binary', 'Binary → Decimal', '-11111111'],
] as const) {
  test(`Number Base Pipeline round-trips a negative integer through ${encode}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/pipeline');
    await page.getByRole('textbox', { name: 'Input', exact: true }).fill('-255');
    await page.getByRole('button', { name: 'Add transform', exact: true }).click();
    await page.getByText(encode, { exact: true }).click();
    const output = page.locator('main pre');
    await expect(output).toHaveText(expectedEncoded);
    await page.getByRole('button', { name: 'Add transform', exact: true }).click();
    await page.getByText(decode, { exact: true }).click();
    await expect(output).toHaveText('-255');
    expect(errors).toEqual([]);
  });
}
