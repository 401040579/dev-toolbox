import { test, expect } from '@playwright/test';

test.describe('Base64 Tool', () => {
  test('encodes text to base64', async ({ page }) => {
    await page.goto('/tools/encoding/base64');
    await expect(page.getByText('Base64 Encode/Decode')).toBeVisible();

    // Type input
    const textarea = page.locator('textarea').first();
    await textarea.fill('hello world');

    // Should show encoded output
    await expect(page.getByText('aGVsbG8gd29ybGQ=')).toBeVisible();
  });

  test('has copy button on output', async ({ page }) => {
    await page.goto('/tools/encoding/base64');
    const textarea = page.locator('textarea').first();
    await textarea.fill('test');

    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();
  });
});

test.describe('JSON Formatter', () => {
  test('formats JSON input', async ({ page }) => {
    await page.goto('/tools/json/json-formatter');
    const textarea = page.locator('textarea').first();
    await textarea.fill('{"a":1,"b":2}');

    // Should show formatted output with keys count
    await expect(page.getByText('2 keys')).toBeVisible();
  });

  test('shows error on invalid JSON', async ({ page }) => {
    await page.goto('/tools/json/json-formatter');
    const textarea = page.locator('textarea').first();
    await textarea.fill('not json');

    await expect(page.getByText('Invalid JSON')).toBeVisible();
  });
});

test.describe('UUID Generator', () => {
  test('generates UUID on load', async ({ page }) => {
    await page.goto('/tools/generators/uuid-generator');
    // UUID format should be visible
    await expect(page.locator('text=/[0-9a-f]{8}-[0-9a-f]{4}/')).toBeVisible();
  });
});

test.describe('Hash Generator', () => {
  test('computes hashes from input', async ({ page }) => {
    await page.goto('/tools/generators/hash-generator');
    const textarea = page.locator('textarea').first();
    await textarea.fill('hello');

    // SHA-256 hash of "hello"
    await expect(page.getByText('2cf24dba5fb0a30e')).toBeVisible();
  });
});

test.describe('Epoch Converter', () => {
  test('loads epoch converter page', async ({ page }) => {
    await page.goto('/tools/time/epoch-converter');
    await expect(page.getByText('Epoch Converter')).toBeVisible();
  });
});
