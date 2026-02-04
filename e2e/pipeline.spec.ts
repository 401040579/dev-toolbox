import { test, expect } from '@playwright/test';

test.describe('Pipeline', () => {
  test('loads pipeline page', async ({ page }) => {
    await page.goto('/pipeline');
    await expect(page.getByText('Pipeline Builder')).toBeVisible();
  });

  test('adds a transform node', async ({ page }) => {
    await page.goto('/pipeline');

    // Click "Add transform"
    await page.getByText('Add transform').click();

    // Select Base64 Encode
    await page.getByText('Base64 Encode').click();

    // Should show 1 node
    await expect(page.getByText('Pipeline (1 nodes)')).toBeVisible();
  });

  test('loads a template', async ({ page }) => {
    await page.goto('/pipeline');

    // Open templates
    await page.getByRole('button', { name: /templates/i }).click();

    // Select first template
    await page.getByText('Base64 → JSON Pretty').click();

    // Should have nodes loaded
    await expect(page.locator('text=/Pipeline \\(\\d+ nodes\\)/')).toBeVisible();
  });

  test('executes pipeline with input', async ({ page }) => {
    await page.goto('/pipeline');

    // Enter input
    const inputArea = page.locator('textarea').first();
    await inputArea.fill('hello');

    // Add base64 encode
    await page.getByText('Add transform').click();
    await page.getByText('Base64 Encode').click();

    // Wait for auto-execution
    await page.waitForTimeout(500);

    // Output should contain base64 encoded result
    await expect(page.getByText('aGVsbG8=')).toBeVisible();
  });
});
