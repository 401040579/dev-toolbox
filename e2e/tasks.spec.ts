import { test, expect } from '@playwright/test';

test('SMS task compares Smart Encoding and persists bilingual preference', async ({ page }) => {
  await page.goto('/tools/text/sms-segment');
  await page.locator('main textarea').fill('Order DEMO-1042 is “ready”—collect at the demo desk. Reply “YES” to confirm your pickup time. Thank you!');
  await expect(page.locator('main').getByText('UCS-2', { exact: true }).last()).toBeVisible();
  await page.getByRole('switch', { name: /smart encoding/i }).click();
  await expect(page.locator('main').getByText('GSM-7', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.locator('main h1')).toContainText('短信');
  await page.reload();
  await expect(page.locator('main h1')).toContainText('短信');
  await page.getByRole('button', { name: '切换语言' }).click();
  await page.reload();
  await expect(page.locator('main h1')).toHaveText('SMS Segment Calculator');
});

test('focused entry points and SMS controls work on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: /Explain an SMS segment jump/ }).click();
  await page.locator('main textarea').fill('DEMO-1042 ready');
  await expect(page.getByRole('switch', { name: /smart encoding/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
