import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test.describe(`structured converters at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('JSON/YAML preserves arrays, empty collections and escapes in both directions', async ({ page }) => {
      await page.goto('/tools/json/json-yaml');
      const input = page.getByRole('textbox');
      const value = { items: [{ sku: 'A', qty: 2 }], empty: [], config: {}, 'a:b': 'C:\\tmp\nline' };
      await input.fill(JSON.stringify(value));
      await expect(page.locator('pre')).toContainText('items:');
      const yaml = (await page.locator('pre').textContent())!;
      await page.getByRole('button', { name: 'YAML → JSON', exact: true }).click();
      await input.fill(yaml);
      await expect(page.locator('pre')).toContainText('"items": [');
      expect(JSON.parse((await page.locator('pre').textContent())!)).toEqual(value);
      await input.fill('a: 1\na: 2');
      await expect(page.getByRole('alert')).toContainText(/Map keys must be unique/);
      await input.clear();
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test('TOML supports inline comments and arrays of tables without prototype pollution', async ({ page }) => {
      await page.goto('/tools/json/toml-converter');
      const input = page.getByRole('textbox').first();
      await input.fill('port = 8080 # comment\n[[items]]\nsku = "A"\n[__proto__]\nauditMarker = "test"\n[constructor.prototype]\nauditMarker = "test"');
      await expect(page.getByRole('textbox').nth(1)).toHaveValue(/"port": 8080/);
      const value = JSON.parse(await page.getByRole('textbox').nth(1).inputValue());
      expect(value.items).toEqual([{ sku: 'A' }]);
      expect(Object.prototype.hasOwnProperty.call(value, '__proto__')).toBe(true);
      expect(await page.evaluate(() => ({
        object: Object.prototype.hasOwnProperty.call(Object.prototype, 'auditMarker'),
        function: Object.prototype.hasOwnProperty.call(Function.prototype, 'auditMarker'),
      }))).toEqual({ object: false, function: false });
      await page.getByRole('button', { name: 'JSON → TOML', exact: true }).click();
      await input.fill('{"value":null}');
      await expect(page.getByRole('alert')).toContainText(/cannot represent null/);
      await input.clear();
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}
