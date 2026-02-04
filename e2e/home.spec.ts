import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads and shows title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dev Toolbox');
  });

  test('shows categories section', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    // Check category headings are visible (exact text in category cards)
    await expect(main.getByText('Time', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Encoding', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Generators', { exact: true }).first()).toBeVisible();
  });

  test('shows pipeline quick access', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    await expect(main.getByText(/pipeline/i).first()).toBeVisible();
  });

  test('navigates to a category', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    await main.getByRole('link', { name: /encoding/i }).first().click();
    await expect(page).toHaveURL(/\/tools\/encoding/);
  });

  test('opens command palette via search button', async ({ page }) => {
    await page.goto('/');
    // Click the search button in the header
    await page.locator('header').getByRole('button').first().click();
    await expect(page.getByPlaceholder('Search tools...')).toBeVisible();
  });

  test('navigates to tool via command palette', async ({ page }) => {
    await page.goto('/');
    // Click the search button in the header
    await page.locator('header').getByRole('button').first().click();
    await page.getByPlaceholder('Search tools...').fill('base64');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tools\/encoding\/base64/);
  });
});
